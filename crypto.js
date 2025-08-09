// crypto.js
// EVM crypto donation flow: connect wallet, select chain, list tokens with non-zero balance,
// validate amount and donate (native or ERC-20). Reads via Alchemy, signing via wallet provider.
(function () {
  const state = {
    provider: null, // window.ethereum
    account: null,
    tokens: [], // [{chainKey, address, symbol, decimals, balanceRaw(BigInt), balanceFmt, chainName}]
    selectedToken: null,
    readClients: {}, // per-chain read clients (AlchemyWeb3 or Web3-compatible)
  };

  const els = {
    connectBtn: null,
    walletSpan: null,
    tokenSelect: null,
    balance: null,
    amount: null,
    maxBtn: null,
    donateBtn: null,
    status: null,
  };

  // ---------- Utils ----------
  function shortAddr(addr) {
    return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "";
  }

  function setStatus(type, msg, link) {
    const colors = { info: "#444", ok: "#0a7", error: "#d33" };
    els.status.innerHTML = link
      ? `${msg} — <a href="${link}" target="_blank" rel="noopener noreferrer">ver tx</a>`
      : msg;
    els.status.style.color = colors[type] || "#444";
  }

  function formatUnits(bi, decimals) {
    const n = BigInt(bi);
    const d = BigInt(decimals);
    const base = 10n ** d;
    const int = n / base;
    const frac = n % base;
    if (frac === 0n) return int.toString();
    const fracStr = frac.toString().padStart(Number(d), "0").replace(/0+$/, "");
    return `${int}.${fracStr}`;
  }

  function parseUnits(str, decimals) {
    const s = String(str || "").trim();
    if (!s || !/^\d+(\.\d+)?$/.test(s)) throw new Error("Invalid amount");
    const [whole, fracRaw] = s.split(".");
    const frac = (fracRaw || "").slice(0, decimals);
    const fracPadded = (frac || "").padEnd(decimals, "0");
    return (
      BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0")
    );
  }

  function cmp(a, b) {
    return a === b ? 0 : a > b ? 1 : -1;
  }
  function getChainCfg(chainKey) {
    const key = chainKey || null;
    const cfgs = window.AppConfig.CHAINS;
    if (!key) return null;
    return cfgs[key];
  }

  // ABI selector for transfer(address,uint256) = 0xa9059cbb
  function encodeErc20Transfer(toAddress, amountBigInt) {
    const methodId = "0xa9059cbb";
    const addr = toAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const amt = amountBigInt.toString(16).padStart(64, "0");
    return methodId + addr + amt;
  }

  // ---------- Provider / Network ----------
  async function connectWallet() {
    if (!window.ethereum) {
      setStatus(
        "error",
        "No se detectó una wallet. Instalá MetaMask o una compatible."
      );
      return;
    }
    state.provider = window.ethereum;
    const accounts = await state.provider.request({
      method: "eth_requestAccounts",
    });
    state.account = accounts[0];

    els.walletSpan.textContent = `${shortAddr(state.account)}`;
    els.tokenSelect.disabled = false;
    setStatus("info", "Wallet conectada. Escanenando redes…");

    await scanAllChains();
  }

  async function ensureChain(chainKey) {
    const cfg = getChainCfg(chainKey);
    try {
      await state.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: cfg.chainIdHex }],
      });
    } catch (err) {
      if (err && err.code === 4902) {
        await state.provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: cfg.chainIdHex,
              chainName: cfg.name,
              rpcUrls: [cfg.rpcUrl],
              nativeCurrency: {
                name: cfg.nativeSymbol,
                symbol: cfg.nativeSymbol,
                decimals: 18,
              },
              blockExplorerUrls: [cfg.explorer],
            },
          ],
        });
      } else {
        throw err;
      }
    }
  }

  function getReadClient(chainKey) {
    if (state.readClients[chainKey]) return state.readClients[chainKey];
    const cfg = getChainCfg(chainKey);
    if (!cfg) return null;
    if (!window.AlchemyWeb3) {
      setStatus("error", "No se cargó AlchemyWeb3 (CDN).");
      return null;
    }
    const client = window.AlchemyWeb3.createAlchemyWeb3(cfg.rpcUrl);
    state.readClients[chainKey] = client;
    return client;
  }

  // ---------- Balances ----------
  async function scanAllChains() {
    try {
      els.tokenSelect.innerHTML = `<option value=\"\">Escaneando…</option>`;
      state.tokens = [];
      const chainKeys = Object.keys(window.AppConfig.CHAINS);
      const evmChains = chainKeys.filter((k) => k !== "tron");

      // Scan EVM chains in parallel
      const results = await Promise.all(
        evmChains.map(async (ck) => {
          const cfg = getChainCfg(ck);
          const client = getReadClient(ck);
          if (!client) return [];

          const tokensForChain = [];

          // Native balance via client
          try {
            const nativeWei = await client.eth.getBalance(state.account);
            const nativeBal = BigInt(nativeWei);
            if (nativeBal > 0n) {
              tokensForChain.push({
                chainKey: ck,
                address: "native",
                symbol: cfg.nativeSymbol,
                decimals: 18,
                balanceRaw: nativeBal,
                balanceFmt: formatUnits(nativeBal, 18),
                chainName: cfg.name,
              });
            }
          } catch (e) {
            // ignore
          }

          // ERC-20 balances
          if (cfg.supportsAlchemy && client.alchemy) {
            try {
              const tb = await client.alchemy.getTokenBalances(
                state.account,
                "erc20"
              );
              const nonZero = (tb.tokenBalances || []).filter(
                (t) => t.tokenBalance && t.tokenBalance !== "0x0"
              );
              const metas = await Promise.all(
                nonZero.map((t) =>
                  client.alchemy.getTokenMetadata(t.contractAddress)
                )
              );
              nonZero.forEach((row, i) => {
                const meta = metas[i] || {};
                const decimals = Number(meta.decimals ?? 18);
                let balRaw = 0n;
                try {
                  balRaw = BigInt(row.tokenBalance);
                } catch {}
                if (balRaw > 0n) {
                  tokensForChain.push({
                    chainKey: ck,
                    address: row.contractAddress,
                    symbol: meta.symbol || "TOKEN",
                    decimals,
                    balanceRaw: balRaw,
                    balanceFmt: formatUnits(balRaw, decimals),
                    chainName: cfg.name,
                  });
                }
              });
            } catch (e) {
              // ignore per-chain errors
            }
          } else {
            // Fallback: curated token list + balanceOf
            const list = (window.AppConfig.TOKEN_LISTS || {})[ck] || [];
            for (const token of list) {
              try {
                const data = encodeErc20BalanceOf(state.account);
                const balHex = await client.eth.call({
                  to: token.address,
                  data,
                });
                const balRaw = BigInt(balHex);
                if (balRaw > 0n) {
                  tokensForChain.push({
                    chainKey: ck,
                    address: token.address,
                    symbol: token.symbol,
                    decimals: Number(token.decimals || 18),
                    balanceRaw: balRaw,
                    balanceFmt: formatUnits(
                      balRaw,
                      Number(token.decimals || 18)
                    ),
                    chainName: cfg.name,
                  });
                }
              } catch (e) {
                // ignore individual token errors
              }
            }
          }

          return tokensForChain;
        })
      );

      // Flatten
      state.tokens = results.flat();

      // Tron scan (optional)
      try {
        if (window.tronWeb && window.tronWeb.ready) {
          const tron = window.tronWeb;
          const tronAddrBase58 = tron.defaultAddress.base58;
          // Native TRX
          try {
            const sun = await tron.trx.getBalance(tronAddrBase58);
            const bi = BigInt(sun);
            if (bi > 0n) {
              state.tokens.push({
                chainKey: "tron",
                address: "native",
                symbol: "TRX",
                decimals: 6,
                balanceRaw: bi,
                balanceFmt: formatUnits(bi, 6),
                chainName: "Tron",
              });
            }
          } catch {}
          // TRC20 from curated list
          const list = (window.AppConfig.TOKEN_LISTS || {}).tron || [];
          for (const token of list) {
            try {
              const contract = await tron.contract().at(token.address);
              const bal = await contract
                .balanceOf(tron.address.toHex(tronAddrBase58))
                .call();
              const bi = BigInt(bal);
              if (bi > 0n) {
                state.tokens.push({
                  chainKey: "tron",
                  address: token.address,
                  symbol: token.symbol,
                  decimals: Number(token.decimals || 6),
                  balanceRaw: bi,
                  balanceFmt: formatUnits(bi, Number(token.decimals || 6)),
                  chainName: "Tron",
                });
              }
            } catch {}
          }
        }
      } catch {}

      renderTokenSelect();
      setStatus(
        "ok",
        `Se encontraron ${state.tokens.length} token(s) con saldo en múltiples redes.`
      );
    } catch (e) {
      console.error(e);
      setStatus("error", `Error al cargar balances: ${e.message || e}`);
      els.tokenSelect.innerHTML = `<option value="">Error</option>`;
    }
  }

  // ERC-20 balanceOf(address) selector
  function encodeErc20BalanceOf(addr) {
    const selector = "0x70a08231";
    const clean = addr.toLowerCase().replace(/^0x/, "");
    const padded = clean.padStart(64, "0");
    return selector + padded;
  }

  function renderTokenSelect() {
    if (state.tokens.length === 0) {
      els.tokenSelect.innerHTML = `<option value="">No hay tokens con saldo</option>`;
      els.tokenSelect.disabled = true;
      els.balance.textContent = "";
      els.donateBtn.disabled = true;
      return;
    }
    els.tokenSelect.disabled = false;
    els.tokenSelect.innerHTML = state.tokens
      .map(
        (t, idx) =>
          `<option value="${idx}">${t.chainName} · ${t.symbol} — ${t.balanceFmt}</option>`
      )
      .join("");

    els.tokenSelect.value = "0";
    state.selectedToken = state.tokens[0];
    renderSelectedToken();
  }

  function renderSelectedToken() {
    const t = state.selectedToken;
    if (!t) {
      els.balance.textContent = "";
      els.donateBtn.disabled = true;
      return;
    }
    els.balance.textContent = `Red: ${t.chainName} — Balance: ${t.balanceFmt} ${t.symbol}`;
    validateAmount();
  }

  function validateAmount() {
    const t = state.selectedToken;
    if (!t) {
      els.donateBtn.disabled = true;
      return null;
    }

    const val = els.amount.value.trim();
    if (!val) {
      els.donateBtn.disabled = true;
      return null;
    }

    try {
      const raw = parseUnits(val, t.decimals);
      const ok = cmp(raw, 0n) > 0 && cmp(raw, t.balanceRaw) <= 0;
      els.donateBtn.disabled = !ok;
      setStatus(
        ok ? "info" : "error",
        ok ? "Listo para donar." : "El monto debe ser > 0 y ≤ balance."
      );
      return raw;
    } catch (e) {
      els.donateBtn.disabled = true;
      setStatus("error", e.message || "Monto inválido.");
      return null;
    }
  }

  async function donate() {
    const t = state.selectedToken;
    if (!t) return;

    const raw = validateAmount();
    if (!raw) return;

    const isTron = t.chainKey === "tron";
    const cfg = getChainCfg(t.chainKey);
    const toEvm = window.AppConfig.DONATION_ADDRESS;
    const toTron = (window.AppConfig.DONATION_ADDRESSES || {}).tron;

    try {
      els.donateBtn.disabled = true;
      setStatus("info", "Enviando transacción… confirmá en tu wallet.");
      let txHash;

      if (isTron) {
        if (!(window.tronWeb && window.tronWeb.ready)) {
          throw new Error("TronLink no detectado o no conectado");
        }
        if (!toTron)
          throw new Error("Configurar dirección de donación TRON en config.js");
        const tron = window.tronWeb;
        if (t.address === "native") {
          const res = await tron.trx.sendTransaction(toTron, Number(raw)); // raw already in sun for TRX
          txHash =
            res &&
            (res.txid || res.transaction
              ? res.txid || res.transaction.txID
              : null);
          setStatus(
            "ok",
            "Transacción enviada en Tron. ¡Gracias por donar!",
            `https://tronscan.org/#/transaction/${txHash}`
          );
        } else {
          const contract = await tron.contract().at(t.address);
          const res = await contract.transfer(toTron, raw.toString()).send();
          txHash = typeof res === "string" ? res : res && res.txid;
          setStatus(
            "ok",
            "Transacción enviada en Tron. ¡Gracias por donar!",
            `https://tronscan.org/#/transaction/${txHash}`
          );
        }
      } else {
        if (!/^0x[a-fA-F0-9]{40}$/.test(toEvm)) {
          throw new Error("Dirección de donación EVM inválida en config.js");
        }
        // Ensure correct EVM chain for signing
        await ensureChain(t.chainKey);
        if (t.address === "native") {
          txHash = await state.provider.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: state.account,
                to: toEvm,
                value: "0x" + raw.toString(16),
              },
            ],
          });
        } else {
          const data = encodeErc20Transfer(toEvm, raw);
          txHash = await state.provider.request({
            method: "eth_sendTransaction",
            params: [{ from: state.account, to: t.address, data }],
          });
        }
        const link = `${cfg.explorer}/tx/${txHash}`;
        setStatus("ok", "Transacción enviada. ¡Gracias por donar!", link);
      }

      // Refresh
      await scanAllChains();
      els.amount.value = "";
      validateAmount();
    } catch (e) {
      console.error(e);
      setStatus("error", `Error al enviar: ${e?.message || e}`);
      els.donateBtn.disabled = false;
    }
  }

  // ---------- Events ----------
  function bindEvents() {
    els.connectBtn.addEventListener("click", connectWallet);

    els.tokenSelect.addEventListener("change", () => {
      const idx = Number(els.tokenSelect.value);
      state.selectedToken = state.tokens[idx] || null;
      renderSelectedToken();
    });

    els.amount.addEventListener("input", validateAmount);
    els.maxBtn.addEventListener("click", () => {
      if (!state.selectedToken) return;
      els.amount.value = state.selectedToken.balanceFmt;
      validateAmount();
    });
    els.donateBtn.addEventListener("click", donate);

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accs) => {
        state.account = accs && accs[0] ? accs[0] : null;
        if (!state.account) {
          els.walletSpan.textContent = "Desconectado";
          state.tokens = [];
          renderTokenSelect();
          return;
        }
        els.walletSpan.textContent = `${shortAddr(state.account)}`;
        await scanAllChains();
      });
    }
  }

  function initDom() {
    els.connectBtn = document.getElementById("crypto-connect-btn");
    els.walletSpan = document.getElementById("crypto-wallet");
    els.tokenSelect = document.getElementById("crypto-token-select");
    els.balance = document.getElementById("crypto-balance");
    els.amount = document.getElementById("crypto-amount");
    els.maxBtn = document.getElementById("crypto-max-btn");
    els.donateBtn = document.getElementById("crypto-donate-btn");
    els.status = document.getElementById("crypto-status");
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDom();
    bindEvents();
  });
})();

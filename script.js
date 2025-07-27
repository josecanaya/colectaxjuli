"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     CONFIG & BARRA DE PROGRESO
  ============================ */
  const META = 1_000_000;
  let recaudado = 250_000;

  const barra = document.getElementById("barra");
  const recaudadoTexto = document.getElementById("recaudado");

  if (barra && recaudadoTexto) {
    const actualizarBarra = () => {
      const porcentaje = Math.min((recaudado / META) * 100, 100);
      barra.style.width = porcentaje + "%";
      recaudadoTexto.textContent = "$" + recaudado.toLocaleString("es-AR");
    };
    actualizarBarra();
  }

  /* ============================
     SLIDER DE HERO
  ============================ */
  const slides = document.querySelectorAll(".slide");
  const textOverlay = document.getElementById("slider-text");
  let currentSlide = 0;

  const cambiarSlide = () => {
    slides.forEach((slide, i) =>
      slide.classList.toggle("active", i === currentSlide)
    );
    if (textOverlay && slides[currentSlide]) {
      textOverlay.textContent = slides[currentSlide].dataset.text || "";
    }
    currentSlide = (currentSlide + 1) % slides.length;
  };

  if (slides.length > 0) {
    cambiarSlide();
    setInterval(cambiarSlide, 4000);
  }

  /* ============================
     INTRO
  ============================ */
  const frases = [
    "When the night has come...",
    "And the land is dark...",
    "No, I won't be afraid...",
    "Just as long as you stand, stand by me",
  ];

  const introOverlay = document.getElementById("intro-overlay");
  const introLines = document.getElementById("intro-lines");
  const introBtn = document.getElementById("intro-btn");

  if (introOverlay && introLines && introBtn) {
    const delayEntreFrases = 800;
    const delayEntreLetras = 50;
    let fraseIndex = 0;

    const escribirFrase = (frase, onDone) => {
      const p = document.createElement("p");
      p.className = "line";
      introLines.appendChild(p);

      [...frase].forEach((letra, i) => {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = letra;
        p.appendChild(span);
        setTimeout(() => span.classList.add("show"), i * delayEntreLetras);
      });

      setTimeout(onDone, frase.length * delayEntreLetras + 50);
    };

    const mostrarFrasesSecuencialmente = () => {
      if (fraseIndex >= frases.length) return;
      escribirFrase(frases[fraseIndex], () => {
        fraseIndex++;
        setTimeout(mostrarFrasesSecuencialmente, delayEntreFrases);
      });
    };

    mostrarFrasesSecuencialmente();

    introBtn.addEventListener("click", () => {
      introOverlay.classList.add("hide");
      document.body.classList.add("fade-in");
      setTimeout(() => document.body.classList.add("show"), 50);
      document.documentElement.style.setProperty("--bg", "#f5fff7");
      document.documentElement.style.setProperty("--text", "#2e2e2e");
    });
  }

  /* ============================
     NAV ACTIVO SEGÚN SCROLL
  ============================ */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".top-nav .nav-link");

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.top-nav a[href="#${id}"]`);
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            link?.classList.add("active");
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }
});

/* ============================
   BOTTOM BAR
============================ */
(function () {
  function initBottomBar() {
    const bottomBar = document.getElementById("bottom-bar");
    if (!bottomBar) return;

    let lastScrollY = window.scrollY;
    const THRESHOLD = 5;

    window.addEventListener(
      "scroll",
      () => {
        const currentY = window.scrollY;
        if (currentY > lastScrollY + THRESHOLD) {
          bottomBar.classList.add("hide");
        } else if (currentY < lastScrollY - THRESHOLD) {
          bottomBar.classList.remove("hide");
        }
        lastScrollY = currentY;
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBottomBar);
  } else {
    initBottomBar();
  }
})();

/* ============================
   CRYPTO DONATIONS
============================ */
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connect-wallet");
  if (!connectBtn) return; // Sección de cripto no presente.

  const walletInfo = document.getElementById("wallet-info");
  const walletAddressSpan = document.getElementById("wallet-address");
  const amountInput = document.getElementById("crypto-amount");
  const depositBtn = document.getElementById("deposit-crypto");

  // Crear elemento para mostrar agradecimiento
  const thankYouDiv = document.createElement("p");
  thankYouDiv.id = "crypto-thanks";
  thankYouDiv.style.cssText =
    "display:none; color: var(--accent); font-weight:bold; margin-top:10px;";
  connectBtn.parentElement.appendChild(thankYouDiv);

  const ALCHEMY_API_KEY = window.CONFIG?.ALCHEMY_API_KEY || "demo";
  const NETWORKS = window.CONFIG?.NETWORKS || [
    { name: "Ethereum", id: "eth-mainnet", displayName: "ETH" },
  ];
  const DONATION_WALLET =
    window.CONFIG?.DONATION_WALLET ||
    "0x0000000000000000000000000000000000000000";

  if (typeof AlchemyWeb3 === "undefined") {
    console.warn("AlchemyWeb3 no se cargó correctamente.");
    return;
  }

  // Instancia web3 para ETH (red principal)
  const ethNetwork =
    NETWORKS.find((n) => n.id === "eth-mainnet") || NETWORKS[0];
  const ETH_ALCHEMY_URL = `https://${ethNetwork.id}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  const web3 = AlchemyWeb3.createAlchemyWeb3(ETH_ALCHEMY_URL, {
    writeProvider: window.ethereum,
  });

  /* ---- Conexión de billetera ---- */
  connectBtn.addEventListener("click", async () => {
    if (!window.ethereum) {
      alert(
        "No se encontró una billetera web3. Instala MetaMask u otra compatible."
      );
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      walletAddressSpan.textContent = `${account.slice(0, 6)}...${account.slice(
        -4
      )}`;
      walletInfo.style.display = "flex";
      connectBtn.textContent = "Billetera conectada";
      connectBtn.disabled = true;

      // Cargar tokens disponibles
      loadTokenBalancesMultiChain(account);
    } catch (err) {
      console.error(err);
      alert("Error al conectar la billetera: " + (err?.message || err));
    }
  });

  /* ---- Donar ---- */
  depositBtn.addEventListener("click", async () => {
    const amount = amountInput.value;
    if (!amount || Number(amount) <= 0) {
      alert("Ingresá un monto válido en ETH");
      return;
    }
    try {
      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) {
        alert("Conectá tu billetera primero");
        return;
      }
      const valueWei = web3.utils.toWei(amount, "ether");
      web3.eth
        .sendTransaction({
          from: accounts[0],
          to: DONATION_WALLET,
          value: valueWei,
        })
        .then((tx) => {
          thankYouDiv.textContent =
            "¡Gracias por tu donación! Transacción enviada: " +
            (tx.transactionHash || tx);
          thankYouDiv.style.display = "block";
          amountInput.value = "";
        });
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al enviar la donación: " + (err?.message || err));
    }
  });

  async function loadTokenBalancesMultiChain(account) {
    const tokenListContainer = document.getElementById("token-list");
    if (!tokenListContainer) return;
    tokenListContainer.innerHTML = "Cargando tokens en todas las cadenas...";

    const allTokens = [];

    // Buscar tokens en cada red
    for (const network of NETWORKS) {
      try {
        const networkTokens = await loadTokenBalancesForNetwork(
          account,
          network
        );
        allTokens.push(...networkTokens);
      } catch (err) {
        console.error(`Error loading tokens for ${network.name}:`, err);
      }
    }

    if (!allTokens.length) {
      tokenListContainer.textContent =
        "No se encontraron tokens con saldo en ninguna red.";
      return;
    }

    tokenListContainer.innerHTML = ""; // limpiar

    // Agrupar por red
    const tokensByNetwork = {};
    allTokens.forEach((token) => {
      if (!tokensByNetwork[token.network.name]) {
        tokensByNetwork[token.network.name] = [];
      }
      tokensByNetwork[token.network.name].push(token);
    });

    // Crear secciones por red
    Object.entries(tokensByNetwork).forEach(([networkName, tokens]) => {
      const networkHeader = document.createElement("h4");
      networkHeader.textContent = networkName;
      networkHeader.style.cssText =
        "margin: 12px 0 8px 0; color: var(--accent); font-size: 0.9rem;";
      tokenListContainer.appendChild(networkHeader);
      console.log(tokens);
      tokens.forEach((tokenData) =>
        createTokenItem(tokenData, tokenListContainer)
      );
    });
  }

  async function loadTokenBalancesForNetwork(account, network) {
    const ALCHEMY_URL = `https://${network.id}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

    try {
      // Llamada RPC a alchemy_getTokenBalances
      const response = await fetch(ALCHEMY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenBalances",
          params: [account, "erc20"],
        }),
      });

      if (!response.ok) {
        throw new Error(`Network ${network.name} failed: ${response.status}`);
      }

      const { result } = await response.json();
      const nonZero = result.tokenBalances.filter(
        (t) => t.tokenBalance && t.tokenBalance !== "0x0"
      );
      const networkTokens = [];

      for (const tb of nonZero) {
        const contract = tb.contractAddress;
        const balanceHex = tb.tokenBalance;
        let metadata;
        try {
          const web3Instance = AlchemyWeb3.createAlchemyWeb3(ALCHEMY_URL);
          metadata = await web3Instance.alchemy.getTokenMetadata(contract);
        } catch (e) {
          metadata = { symbol: "TOKEN", decimals: 18 };
        }

        const decimals = metadata.decimals ?? 18;
        const symbol = metadata.symbol ?? contract.substring(0, 6);

        const balanceBn = web3.utils.toBN(balanceHex);

        if (balanceBn.isZero()) {
          // Balance exactamente 0, omitir
          continue;
        }

        const humanBalance = formatUnits(balanceBn, decimals, 4); // 4 decimales

        // Obtener precio aproximado en USD
        const priceUSD = getApproxPrice(contract, network);
        if (priceUSD !== null) {
          const totalUSD = parseFloat(humanBalance) * priceUSD;
          if (totalUSD < 1) {
            // Valor total menor a 1 USD → omitir
            continue;
          }
        }

        // Verificar si el token tiene valor de mercado
        const hasMarketValue = checkTokenPrice(contract, metadata, network);
        if (!hasMarketValue) {
          console.log(`Token ${symbol} sin valor de mercado, omitiendo...`);
          continue;
        }

        networkTokens.push({
          contract,
          balanceBn,
          decimals,
          symbol,
          humanBalance,
          network,
        });
      }

      return networkTokens;
    } catch (err) {
      console.error(`Error fetching tokens for ${network.name}:`, err);
      return [];
    }
  }

  function createTokenItem(tokenData, container) {
    const { contract, balanceBn, decimals, symbol, humanBalance, network } =
      tokenData;

    // Crear elemento UI
    const item = document.createElement("div");
    item.className = "token-item";

    const label = document.createElement("span");
    label.textContent = `${symbol}: ${humanBalance}`;

    // Actions container
    const actions = document.createElement("div");
    actions.className = "token-actions";

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.min = 0;
    amountInput.step = "any";
    amountInput.placeholder = "0";
    amountInput.className = "token-amount";
    amountInput.max = humanBalance;

    const maxBtn = document.createElement("button");
    maxBtn.textContent = "MAX";
    maxBtn.className = "token-max";
    maxBtn.addEventListener("click", () => {
      amountInput.value = humanBalance;
    });

    const donateBtn = document.createElement("button");
    donateBtn.textContent = "Donar";
    donateBtn.addEventListener("click", () => {
      const amountStr = amountInput.value || "0";
      if (Number(amountStr) <= 0) {
        alert("Ingresá un monto válido");
        return;
      }
      const amountBn = parseUnits(amountStr, decimals);
      if (amountBn.gt(balanceBn)) {
        alert("No tenés balance suficiente");
        return;
      }
      donateToken(contract, amountBn, decimals, symbol, network);
    });

    actions.appendChild(amountInput);
    actions.appendChild(maxBtn);
    actions.appendChild(donateBtn);

    item.appendChild(label);
    item.appendChild(actions);
    container.appendChild(item);
  }

  function parseUnits(valueStr, decimals) {
    const [whole, frac = ""] = valueStr.split(".");
    if (frac.length > decimals) {
      throw new Error("Demasiados decimales");
    }
    const paddedFrac = frac.padEnd(decimals, "0");
    const combined = whole + paddedFrac;
    return web3.utils.toBN(combined === "" ? "0" : combined);
  }

  function formatUnits(bn, decimals, displayDecimals = 4) {
    const divisor = web3.utils.toBN(10).pow(web3.utils.toBN(decimals));
    const whole = bn.div(divisor).toString();
    let fracBn = bn.mod(divisor).toString().padStart(decimals, "0");
    // recortar a displayDecimals
    fracBn = fracBn.substring(0, displayDecimals);
    // eliminar ceros finales
    fracBn = fracBn.replace(/0+$/, "");
    return fracBn.length ? `${whole}.${fracBn}` : whole;
  }

  async function donateToken(
    contractAddress,
    amountBn,
    decimals,
    symbol,
    network
  ) {
    try {
      const ALCHEMY_URL = `https://${network.id}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
      const web3 = AlchemyWeb3.createAlchemyWeb3(ALCHEMY_URL, {
        writeProvider: window.ethereum,
      });

      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) {
        alert("Conectá tu billetera primero");
        return;
      }

      // Verificar que estamos en la red correcta
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const requiredChainId = getChainId(network.id);

      if (currentChainId !== requiredChainId) {
        alert(
          `Cambiá a la red ${network.name} en tu billetera para donar este token`
        );
        return;
      }

      // Usar contrato ERC-20 para transferir monto indicado
      const abi = [
        {
          constant: false,
          inputs: [
            { name: "_to", type: "address" },
            { name: "_value", type: "uint256" },
          ],
          name: "transfer",
          outputs: [{ name: "", type: "bool" }],
          type: "function",
        },
      ];

      const contract = new web3.eth.Contract(abi, contractAddress);

      await contract.methods
        .transfer(DONATION_WALLET, amountBn.toString())
        .send({ from: accounts[0] })
        .on("transactionHash", (hash) => {
          thankYouDiv.textContent = `¡Gracias por donar ${symbol} en ${network.name}! Tx: ${hash}`;
          thankYouDiv.style.display = "block";
        });
    } catch (err) {
      console.error(err);
      alert("Error al donar token: " + (err?.message || err));
    }
  }

  function getChainId(networkId) {
    const chainIds = {
      "eth-mainnet": "0x1",
      "polygon-mainnet": "0x89",
      "arb-mainnet": "0xa4b1",
      "opt-mainnet": "0xa",
      "base-mainnet": "0x2105",
      "bnb-mainnet": "0x38",
      "avax-mainnet": "0xa86a",
    };
    return chainIds[networkId] || "0x1";
  }

  function checkTokenPrice(contractAddress, metadata, network) {
    // Lista de tokens conocidos con valor (principales stablecoins, wrapped tokens, etc.)
    const knownValueTokens = [
      // Ethereum mainnet
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // UNI
      "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", // MATIC
      "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b", // CRO
      // Polygon
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // WMATIC
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC.e
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      // Arbitrum
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
      // Optimism
      "0x4200000000000000000000000000000000000006", // WETH
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // USDC
      // Base
      "0x4200000000000000000000000000000000000006", // WETH
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC
    ];

    const addressLower = contractAddress.toLowerCase();

    // 1. Verificar si está en lista de tokens conocidos
    if (knownValueTokens.some((addr) => addr.toLowerCase() === addressLower)) {
      return true;
    }

    // 2. Filtrar por metadatos válidos
    if (!metadata.symbol || !metadata.name) {
      console.log(
        `Token ${contractAddress} sin metadatos válidos, omitiendo...`
      );
      return false;
    }

    // 3. Filtrar tokens sospechosos
    const suspiciousPatterns = [
      /test/i,
      /fake/i,
      /scam/i,
      /^[a-f0-9]{6,}$/i, // Solo caracteres hexadecimales
      /\$+/, // Múltiples símbolos de dólar
      /[👑��💎🔥]/, // Emojis comunes en tokens basura
    ];

    const symbolSuspicious = suspiciousPatterns.some(
      (pattern) => pattern.test(metadata.symbol) || pattern.test(metadata.name)
    );

    if (symbolSuspicious) {
      console.log(`Token ${metadata.symbol} parece sospechoso, omitiendo...`);
      return false;
    }

    // 4. Verificar decimales válidos (0-18)
    const decimals = metadata.decimals;
    if (decimals == null || decimals < 0 || decimals > 18) {
      console.log(
        `Token ${metadata.symbol} con decimales inválidos (${decimals}), omitiendo...`
      );
      return false;
    }

    // 5. Filtrar símbolos muy largos o muy cortos
    if (metadata.symbol.length > 10 || metadata.symbol.length < 2) {
      console.log(
        `Token ${metadata.symbol} con símbolo de longitud inválida, omitiendo...`
      );
      return false;
    }

    return true; // Pasa todos los filtros
  }

  function getApproxPrice(contractAddress, network) {
    const priceMap = {
      // Ethereum
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 1, // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7": 1, // USDT
      "0x6b175474e89094c44da98b954eedeac495271d0f": 1, // DAI
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 3500, // WETH approx
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 65000, // WBTC approx
      // Polygon
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": 1, // WMATIC placeholder ~1? update
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": 1,
      // Arbitrum WETH same address
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": 3500,
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": 1,
      // Optimism
      "0x4200000000000000000000000000000000000006": 3500, // WETH OP/Base
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607": 1,
      // Base USDC
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 1,
    };
    const key = contractAddress.toLowerCase();
    if (priceMap[key] !== undefined) return priceMap[key];
    return null; // precio desconocido
  }
});

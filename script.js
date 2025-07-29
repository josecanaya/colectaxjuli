"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     CONFIG & BARRA DE PROGRESO
  ============================ */
  const META = 25_000_000;
  let recaudado = 2_645_340;

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
  const frases = [
    "When the night has come...",
    "And the land is dark...",
    "And the Moon is the only light we'll see..",
    "No, I won't be afraid...",
    "Just as long as you stand",
  ];

  // Última frase como variable aparte
  const ultimaFrase = "Stand by me.";

  const introOverlay = document.getElementById("intro-overlay");
  const introLines = document.getElementById("intro-lines");
  const introBtn = document.getElementById("intro-btn");
  const luna = document.getElementById("luna");
  const ojo = document.getElementById("logo-ojo");
  const skipBtn = document.getElementById("skip-btn"); // Botón "Saltar animación"

  if (introOverlay && introLines && introBtn && luna && ojo) {
    const delayEntreFrases = 800;
    const delayEntreLetras = 50;
    let fraseIndex = 0;

    // Función para escribir una frase
    const escribirFrase = (frase, onDone, extraClass = "") => {
      const p = document.createElement("p");
      p.className = `line ${extraClass}`.trim();
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

    // Mostrar frases secuencialmente
    const mostrarFrasesSecuencialmente = () => {
      if (fraseIndex >= frases.length) {
        // Mostrar la última frase en grande
        setTimeout(() => {
          introLines.innerHTML = ""; // Eliminar todas las anteriores
          escribirFrase(ultimaFrase, () => {}, "final");
          setTimeout(() => {
            const finalLine = introLines.querySelector(".final");
            if (finalLine) finalLine.classList.add("big");
          }, 300);
        }, 500);
        return;
      }

      escribirFrase(frases[fraseIndex], () => {
        fraseIndex++;
        setTimeout(mostrarFrasesSecuencialmente, delayEntreFrases);
      });
    };

    mostrarFrasesSecuencialmente();

    // Función para cerrar el overlay

    const cerrarOverlay = () => {
      introOverlay.classList.add("hide");
      introBtn.style.pointerEvents = "none"; // Desactivar clics del botón
      document.body.classList.add("fade-in");
      setTimeout(() => document.body.classList.add("show"), 50);
      document.documentElement.style.setProperty("--bg", "#f5fff7");
      document.documentElement.style.setProperty("--text", "#2e2e2e");
    };

    introBtn.addEventListener("click", cerrarOverlay);

    // Entrar con Enter
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") cerrarOverlay();
    });

    // Botón Skip (aparece a los 5 segundos)

    if (skipBtn) {
      setTimeout(() => {
        skipBtn.classList.add("show");
      }, 5000);

      // Funciona en PC
      skipBtn.addEventListener("click", cerrarOverlay);

      // Funciona en móvil (responde instantáneo)
      skipBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        cerrarOverlay();
      });
    }

    // Luna aparece después de 5 segundos
    setTimeout(() => luna.classList.add("show"), 5000);

    // Luna desaparece y aparece ojo en la misma posición al segundo 13
    setTimeout(() => {
      luna.classList.remove("show");
      ojo.classList.add("show");

      // Desaparecer el ojo después de abrirse
      setTimeout(() => ojo.classList.remove("show"), 2000);
    }, 13000);

    // Fondo blanco al segundo 13.5
    setTimeout(() => {
      introOverlay.classList.add("fade-white");
    }, 13500);

    // **Ocultar última frase antes de que aparezca el botón**
    setTimeout(() => {
      const finalLine = introLines.querySelector(".final");
      if (finalLine) finalLine.style.opacity = 0;
    }, 15000);

    // Botón aparece centrado al segundo 17
    setTimeout(() => introBtn.classList.add("show"), 17000);
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

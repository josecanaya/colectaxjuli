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
    slides.forEach((slide, i) => slide.classList.toggle("active", i === currentSlide));
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
    "Just as long as you stand, stand by me"
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
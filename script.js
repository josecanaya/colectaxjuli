"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     CONFIG & BARRA DE PROGRESO
  ============================ */
  const META = 36_000;
  let recaudado = 6859.22;

  const barra = document.getElementById("barra");
  const recaudadoTexto = document.getElementById("recaudado");

  if (barra && recaudadoTexto) {
    const actualizarBarra = () => {
      const porcentaje = Math.min((recaudado / META) * 100, 100);
      barra.style.width = porcentaje + "%";

      recaudadoTexto.textContent =
        recaudado.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " U$D";
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

  ---

  /* ============================
     INTRO OVERLAY VIDEO
  ============================ */
  const introOverlay = document.getElementById("intro-overlay");
  const skipBtn = document.getElementById("skip-btn");
  const introVideo = document.getElementById("intro-video");

  if (introVideo) {
    introVideo.playbackRate = 0.5;
  }

  const cerrarOverlay = () => {
    if (introOverlay) {
      introOverlay.classList.add("hide");
      setTimeout(() => introOverlay.remove(), 800);
    }

    const rifaSection = document.getElementById("rifa-solidaria");
    if (rifaSection) {
      rifaSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (skipBtn) {
    skipBtn.addEventListener("click", cerrarOverlay);
  }

  if (introVideo) {
    introVideo.addEventListener("ended", cerrarOverlay);
  }

  ---

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
});

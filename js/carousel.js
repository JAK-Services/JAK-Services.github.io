// js/carousel.js
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const carousels = document.querySelectorAll(".carousel");
    if (!carousels.length) return;

    const INTERVAL_MS = 4000;

    carousels.forEach((carousel) => {
      const slides = carousel.querySelectorAll(".carousel-slide");
      const prevBtn = carousel.querySelector(".carousel-btn.prev");
      const nextBtn = carousel.querySelector(".carousel-btn.next");
      const dots = carousel.querySelectorAll(".carousel-dots .dot");
      const toggleBtn = carousel.querySelector(".carousel-toggle");

      let current = 0;
      let isPlaying = true;
      let autoInterval = null;

      const playLabel =
        (toggleBtn && toggleBtn.dataset.playLabel) || "Play";
      const pauseLabel =
        (toggleBtn && toggleBtn.dataset.pauseLabel) || "Pause";

      function showSlide(index) {
        slides.forEach((slide, i) => {
          slide.classList.toggle("active", i === index);
        });
        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === index);
        });
        current = index;
      }

      function nextSlide() {
        showSlide((current + 1) % slides.length);
      }

      function prevSlide() {
        showSlide((current - 1 + slides.length) % slides.length);
      }

      function startAuto() {
        if (autoInterval) return;
        autoInterval = setInterval(nextSlide, INTERVAL_MS);
      }

      function stopAuto() {
        if (!autoInterval) return;
        clearInterval(autoInterval);
        autoInterval = null;
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          nextSlide();
          if (isPlaying) {
            stopAuto();
            startAuto();
          }
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          prevSlide();
          if (isPlaying) {
            stopAuto();
            startAuto();
          }
        });
      }

      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const idx = parseInt(dot.dataset.index, 10);
          if (Number.isFinite(idx)) {
            showSlide(idx);
            if (isPlaying) {
              stopAuto();
              startAuto();
            }
          }
        });
      });

      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          if (isPlaying) {
            isPlaying = false;
            stopAuto();
            toggleBtn.textContent = playLabel;
            toggleBtn.setAttribute("aria-pressed", "true");
          } else {
            isPlaying = true;
            startAuto();
            toggleBtn.textContent = pauseLabel;
            toggleBtn.setAttribute("aria-pressed", "false");
          }
        });
      }

      // Initialize
      if (slides.length) {
        showSlide(0);
        startAuto();
        if (toggleBtn) {
          toggleBtn.textContent = pauseLabel;
          toggleBtn.setAttribute("aria-pressed", "false");
        }
      }
    });
  });
})();

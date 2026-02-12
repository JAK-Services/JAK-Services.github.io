// Provides an auto-playing, accessible image/content carousel.
// Supports manual navigation, indicators, and play/pause control.
// Handles multiple carousels on a single page.

(() => {
  document.addEventListener("DOMContentLoaded", () => {

    // Locate all carousel components on the page.
    // Exit early if no carousels are present.
    // Prevents unnecessary setup work.
    const carousels = document.querySelectorAll(".carousel");
    if (!carousels.length) return;

    // Define the autoplay interval duration.
    // Shared across all carousel instances.
    // Adjusts slide rotation speed.
    const INTERVAL_MS = 4000;

    carousels.forEach((carousel) => {

      // Cache carousel elements and controls.
      // Enables navigation and indicator updates.
      // Scopes all queries to the current carousel.
      const slides = carousel.querySelectorAll(".carousel-slide");
      const prevBtn = carousel.querySelector(".carousel-btn.prev");
      const nextBtn = carousel.querySelector(".carousel-btn.next");
      const dots = carousel.querySelectorAll(".carousel-dots .dot");
      const toggleBtn = carousel.querySelector(".carousel-toggle");

      // Track carousel state and timers.
      // current: active slide index.
      // isPlaying: autoplay state.
      let current = 0;
      let isPlaying = true;
      let autoInterval = null;

      // Resolve accessible labels for play/pause control.
      // Allows customization via data attributes.
      // Falls back to default text.
      const playLabel =
        (toggleBtn && toggleBtn.dataset.playLabel) || "Play";
      const pauseLabel =
        (toggleBtn && toggleBtn.dataset.pauseLabel) || "Pause";

      // Activates the requested slide and indicator.
      // Updates internal state to match UI.
      // Ensures only one slide is visible.
      function showSlide(index) {
        slides.forEach((slide, i) => {
          slide.classList.toggle("active", i === index);
        });
        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === index);
        });
        current = index;
      }

      // Advance to the next slide cyclically.
      // Wraps automatically at the end.
      // Delegates rendering to showSlide.
      function nextSlide() {
        showSlide((current + 1) % slides.length);
      }

      // Move to the previous slide cyclically.
      // Wraps automatically at the beginning.
      // Delegates rendering to showSlide.
      function prevSlide() {
        showSlide((current - 1 + slides.length) % slides.length);
      }

      // Start automatic slide rotation.
      // Prevents multiple timers from running.
      // Uses a fixed interval.
      function startAuto() {
        if (autoInterval) return;
        autoInterval = setInterval(nextSlide, INTERVAL_MS);
      }

      // Stop automatic slide rotation.
      // Clears and resets the interval timer.
      // Safe to call multiple times.
      function stopAuto() {
        if (!autoInterval) return;
        clearInterval(autoInterval);
        autoInterval = null;
      }

      // Bind click behavior for the "next" control.
      // Advances slides and resets autoplay timer.
      // Maintains smooth user interaction.
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          nextSlide();
          if (isPlaying) {
            stopAuto();
            startAuto();
          }
        });
      }

      // Bind click behavior for the "previous" control.
      // Moves slides backward and resets autoplay timer.
      // Maintains smooth user interaction.
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          prevSlide();
          if (isPlaying) {
            stopAuto();
            startAuto();
          }
        });
      }

      // Bind click behavior for slide indicator dots.
      // Jumps directly to the selected slide.
      // Resets autoplay timing if active.
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

      // Bind play/pause toggle control.
      // Updates autoplay state and accessibility attributes.
      // Reflects current mode in button text.
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

      // Perform initial carousel setup.
      // Activate the first slide and start autoplay.
      // Initialize toggle button state if present.
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

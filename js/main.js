// Initializes shared site UI behavior on page load.
// Injects common layout elements and manages language state.
// Enables interactive rule list expansion.

document.addEventListener('DOMContentLoaded', () => {

  // Loads and injects the shared site header markup.
  // Ensures consistent navigation across all pages.
  // Defers setup until the header is available.
  fetch('header.html')
    .then(response => response.text())
    .then(html => {
      // Insert fetched header HTML into the page
      const container = document.getElementById('site-header');
      if (!container) return;
      container.innerHTML = html;

      // Manages language switching and persistence.
      // Updates UI state and active controls.
      // Stores preference for future visits.
      const buttons = document.querySelectorAll('.lang-btn');
      function setLang(lang) {
        // Update language-specific body classes
        document.body.classList.remove('lang-en', 'lang-fr');
        document.body.classList.add('lang-' + lang);

        // Reflect active language in the UI
        buttons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.lang === lang);
        });
      }

      // Determines initial language on first visit.
      // Falls back to browser preferences.
      // Persists selection for subsequent loads.
      if (!localStorage.getItem('jak-lang')) {
        const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        const initial = browserLang.startsWith('fr') ? 'fr' : 'en';
        setLang(initial);
        localStorage.setItem('jak-lang', initial);
      } else {
        setLang(localStorage.getItem('jak-lang'));
      }

      // Binds click handlers for manual language switching.
      // Updates state immediately on interaction.
      // Persists the chosen language.
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          setLang(lang);
          localStorage.setItem('jak-lang', lang);
        });
      });
    })
    .catch(err => {
      // Reports header load failures for debugging
      console.error('Could not load header:', err);
    });

  // Updates the footer with the current year.
  // Keeps copyright text current.
  // Executes safely if the element exists.
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Enables expandable behavior for rule list items.
  // Toggles detail visibility on item click.
  // Ignores clicks inside expanded content.
  const items = document.querySelectorAll('.toggle-list .has-detail');

  items.forEach(item => {
    item.addEventListener('click', event => {
      // Prevent toggling when interacting with inner content
      if (event.target.closest('.item-detail')) return;

      event.preventDefault();
      item.classList.toggle('open');
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // 1) Inject shared header
  fetch('header.html')
    .then(response => response.text())
    .then(html => {
      const container = document.getElementById('site-header');
      if (!container) return;
      container.innerHTML = html;

      // 2) Set up language switch
      const buttons = document.querySelectorAll('.lang-btn');
      function setLang(lang) {
        document.body.classList.remove('lang-en', 'lang-fr');
        document.body.classList.add('lang-' + lang);
        buttons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.lang === lang);
        });
      }

      // Auto-detect on first visit (like your current index.html does)
      if (!localStorage.getItem('jak-lang')) {
        const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        const initial = browserLang.startsWith('fr') ? 'fr' : 'en';
        setLang(initial);
        localStorage.setItem('jak-lang', initial);
      } else {
        setLang(localStorage.getItem('jak-lang'));
      }

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          setLang(lang);
          localStorage.setItem('jak-lang', lang);
        });
      });
    })
    .catch(err => {
      console.error('Could not load header:', err);
    });

  // 3) Set footer year if present
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 4) Expandable list items
  const items = document.querySelectorAll('.toggle-list .has-detail');

  items.forEach(item => {
    const label = item.querySelector('.item-label');
    if (!label) return;

    label.addEventListener('click', event => {
      event.preventDefault();
      item.classList.toggle('open');
    });
  });
});

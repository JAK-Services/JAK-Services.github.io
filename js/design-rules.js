// design-rules.js
// Page-specific enhancements for pcb-design-rules.html:
// - Assign stable IDs to each expandable rule item (.has-detail)
// - Auto-expand a rule when arriving via a #hash deep link
//
// This file is intentionally standalone to avoid impacting other pages.

(function () {
  function slugify(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      // Replace accented characters fairly safely (basic normalize)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");
  }

  function ensureRuleIds() {
    const sections = document.querySelectorAll("main section.card[id]");

    sections.forEach((section) => {
      const list = section.querySelector("ul.toggle-list");
      if (!list) return;

      const items = Array.from(list.querySelectorAll("li.has-detail"));
      items.forEach((item, idx) => {
        // Translation-proof stable ID: based on section and item order, not on visible text.
        const stableId = `${section.id}__r${String(idx + 1).padStart(2, "0")}`;
        if (item.id !== stableId) item.id = stableId;
      });
    });
  });
  }

  function openRuleFromHash() {
    const raw = window.location.hash ? window.location.hash.substring(1) : "";
    const hash = raw ? decodeURIComponent(raw) : "";
    if (!hash) return;

    const target = document.getElementById(hash);
    if (!target) return;

    // If the hash points to a rule item, open it.
    if (target.classList && target.classList.contains("has-detail")) {
      target.classList.add("open");

      // Scroll to the rule with a small offset for sticky headers (if any)
      // Use requestAnimationFrame so the browser can apply the "open" class first.
      requestAnimationFrame(() => {
        const y = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
      return;
    }

    // If the hash points to a section, do nothing special (native behavior already scrolls).
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureRuleIds();
    openRuleFromHash();

    // Chrome Translate can rewrite large parts of the DOM after load.
    // Re-apply IDs and re-open the hash when the DOM changes.
    let t = null;
    const onMut = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        ensureRuleIds();
        openRuleFromHash();
      }, 50);
    };
    const obs = new MutationObserver(onMut);
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });

  window.addEventListener("hashchange", () => {
    // Ensure IDs exist even if some content was injected after load
    ensureRuleIds();
    openRuleFromHash();
  });
})();

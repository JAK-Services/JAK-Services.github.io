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
    const items = document.querySelectorAll(".toggle-list .has-detail");
    items.forEach((item) => {
      if (item.id) return;

      const section = item.closest("section[id]");
      const sectionId = section ? section.id : "pcb-design-rules";

      // Use the visible label if present; fall back to title attribute
      const labelEl = item.querySelector(".item-label");
      const labelText = labelEl ? labelEl.textContent : (item.getAttribute("title") || "");
      const labelSlug = slugify(labelText);

      // Stable deterministic ID used by the checklist generator
      item.id = `${sectionId}__${labelSlug}`;
    });
  }

  function openRuleFromHash() {
    const hash = window.location.hash ? window.location.hash.substring(1) : "";
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

  function openAllRulesByDefault() {
    document.querySelectorAll(".toggle-list .has-detail").forEach((item) => {
      item.classList.add("open");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureRuleIds();
    openAllRulesByDefault();   // <-- added
    openRuleFromHash();        // hash still works (and will scroll nicely)
  });

  window.addEventListener("hashchange", () => {
    // Ensure IDs exist even if some content was injected after load
    ensureRuleIds();
    openRuleFromHash();
  });
})();

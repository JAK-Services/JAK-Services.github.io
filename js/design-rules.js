// design-rules.js
// Page-specific enhancements for pcb-design-rules.html:
// - Assign stable IDs to each expandable rule item (.has-detail) using an index-based key
//   (robust against browser auto-translation which can rewrite text nodes)
// - Auto-expand a rule when arriving via a #hash deep link
//
// This file is intentionally standalone to avoid impacting other pages.

(function () {
  "use strict";

  function getRuleItems() {
    return Array.from(document.querySelectorAll(".toggle-list section[id]")).flatMap((section) => {
      const items = Array.from(section.querySelectorAll(".has-detail"));
      return items.map((item, idx) => ({ section, item, idx }));
    });
  }

  // Stable, translation-proof key: <sectionId>__r<index>
  // Example: pcb_design_rules_schematics__r03
  function makeKey(sectionId, idx) {
    const n = String(idx + 1).padStart(2, "0");
    return `${sectionId}__r${n}`;
  }

  function ensureRuleIds() {
    const sections = Array.from(document.querySelectorAll(".toggle-list section[id]"));
    sections.forEach((section) => {
      const sectionId = section.id || "pcb-design-rules";
      const items = Array.from(section.querySelectorAll(".has-detail"));

      items.forEach((item, idx) => {
        const key = makeKey(sectionId, idx);
        item.dataset.ruleKey = key;         // persists even if text changes
        item.id = key;                      // anchor target
      });
    });
  }

  function openRuleFromHash() {
    const hash = window.location.hash ? window.location.hash.substring(1) : "";
    if (!hash) return;

    const target = document.getElementById(hash);
    if (!target) return;

    if (target.classList && target.classList.contains("has-detail")) {
      target.classList.add("open");

      requestAnimationFrame(() => {
        const y = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
    }
  }

  function observeDomChanges() {
    // Chrome auto-translate can rewrite DOM nodes and drop ids/classes on replaced nodes.
    // Re-apply ids and attempt to open the hash whenever the rules list mutates.
    const root = document.querySelector(".toggle-list") || document.body;
    const obs = new MutationObserver(() => {
      ensureRuleIds();
      openRuleFromHash();
    });
    obs.observe(root, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureRuleIds();
    openRuleFromHash();
    observeDomChanges();
  });

  window.addEventListener("hashchange", () => {
    ensureRuleIds();
    openRuleFromHash();
  });
})();

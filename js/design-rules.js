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

  
  function getToggleAllStrings() {
    const langAttr = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    const isFr = langAttr.startsWith("fr") || window.location.pathname.includes("/fr/");
    return isFr
      ? {
          label: "Tout déplier",
          aria: "Déplier ou replier tous les détails des règles",
        }
      : {
          label: "Expand all",
          aria: "Expand/collapse all rule details",
        };
  }

// --- Global expand/collapse toggle (checkboxes next to each <h2> from "Schematics" onward) ---

  function setAllRuleItemsOpen(isOpen) {
    document.querySelectorAll(".toggle-list .has-detail").forEach((item) => {
      item.classList.toggle("open", !!isOpen);
    });
  }

  function getRuleItemsOpenState() {
    const items = Array.from(document.querySelectorAll(".toggle-list .has-detail"));
    const total = items.length;
    const openCount = items.reduce((acc, el) => acc + (el.classList.contains("open") ? 1 : 0), 0);
    return {
      total,
      openCount,
      allOpen: total > 0 && openCount === total,
      allClosed: total > 0 && openCount === 0,
      mixed: total > 0 && openCount > 0 && openCount < total,
    };
  }

  function syncToggleAllCheckboxes() {
    const state = getRuleItemsOpenState();
    const boxes = document.querySelectorAll('input[type="checkbox"][data-toggle-all-rules="true"]');
    boxes.forEach((box) => {
      // If there are no expandable items, keep the control disabled.
      box.disabled = state.total === 0;

      if (state.total === 0) {
        box.indeterminate = false;
        box.checked = false;
        return;
      }

      if (state.mixed) {
        box.indeterminate = true;
        // Keep checked visually false when indeterminate (browser renders mixed state)
        box.checked = false;
      } else {
        box.indeterminate = false;
        box.checked = state.allOpen;
      }
    });
  }

  function injectToggleAllControls() {
    const schematicsH2 = document.querySelector("#pcb_design_rules_schematics > h2");
    if (!schematicsH2) return;

    // Collect all h2 in order, then start injecting once we reach "Schematics"
    const h2s = Array.from(document.querySelectorAll("main.container section.card > h2"));
    let start = false;

    h2s.forEach((h2) => {
      if (h2 === schematicsH2) start = true;
      if (!start) return;

      // Avoid double-injecting if script runs twice (e.g., hot reload / cached partial loads)
      if (h2.querySelector("[data-toggle-all-wrapper='true']")) return;

      const wrapper = document.createElement("span");
      wrapper.setAttribute("data-toggle-all-wrapper", "true");
      wrapper.style.display = "inline-flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "0.4rem";
      wrapper.style.marginLeft = "0.75rem";
      wrapper.style.fontWeight = "normal";
      wrapper.style.fontSize = "0.9rem";
      wrapper.style.whiteSpace = "nowrap";

      const box = document.createElement("input");
      box.type = "checkbox";
      box.setAttribute("data-toggle-all-rules", "true");
      const strings = getToggleAllStrings();
      box.setAttribute("aria-label", strings.aria);

      const label = document.createElement("span");
      label.textContent = strings.label;

      // Clicking the checkbox should not trigger any other click handlers
      box.addEventListener("click", (e) => e.stopPropagation());

      box.addEventListener("change", () => {
        // If it was indeterminate, the browser usually sets checked=true on click,
        // but we force a deterministic action based on the new checked state.
        box.indeterminate = false;

        setAllRuleItemsOpen(box.checked);

        // Keep every checkbox in sync.
        syncToggleAllCheckboxes();
      });

      wrapper.appendChild(box);
      wrapper.appendChild(label);
      h2.appendChild(wrapper);
    });

    // Initial sync once controls exist
    syncToggleAllCheckboxes();

    // Keep checkboxes synced when users expand/collapse individual items (main.js handler).
    // We update after any click on a rule item.
    document.addEventListener("click", (event) => {
      const li = event.target && event.target.closest && event.target.closest(".toggle-list .has-detail");
      if (!li) return;

      // main.js toggles on the same click; wait one frame for the class to update
      requestAnimationFrame(syncToggleAllCheckboxes);
    });

    // Also keep in sync when opening a rule via hash navigation
    window.addEventListener("hashchange", () => requestAnimationFrame(syncToggleAllCheckboxes));
  }


  document.addEventListener("DOMContentLoaded", () => {
    ensureRuleIds();
    openAllRulesByDefault();   // <-- added
    openRuleFromHash();        // hash still works (and will scroll nicely)
    injectToggleAllControls();
  });

  window.addEventListener("hashchange", () => {
    // Ensure IDs exist even if some content was injected after load
    ensureRuleIds();
    openRuleFromHash();
  });
})();

// design-rules.js
// Page-specific enhancements for pcb-design-rules.html:
// - Assign stable IDs to each expandable rule item (.has-detail)
// - Auto-expand a rule when arriving via a #hash deep link
//
// This file is intentionally standalone to avoid impacting other pages.

(function () {
	// Enhance rule lists with stable anchors and bulk toggles.
	// Support deep links that open and scroll to a specific rule detail.
	// Initialize behaviors on load and respond to hash navigation changes.

  function slugify(text) {
	// Create a URL-friendly slug for rule labels and section IDs.
	// Normalizes text to avoid accents and inconsistent separators.
	// Produces stable IDs suitable for deep-linking and external generators.
	// Normalize input for consistent slug output
    return String(text || "")
      .trim()
      .toLowerCase()
      // Remove accents/diacritics for safer URLs
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      // Convert common symbols and whitespace into separators
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      // Trim and collapse separators to keep IDs tidy
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");
  }

  function ensureRuleIds() {
	// Assign deterministic IDs to expandable rule items when missing.
	// Derives IDs from their section context and visible label text.
	// Ensures deep links and checklist tooling can target items reliably.
	// Find all expandable rule items on the page
	const items = document.querySelectorAll(".toggle-list .has-detail");
    // Populate missing IDs deterministically for each item
    items.forEach((item) => {
      if (item.id) return;

      // Resolve the containing section to namespace the ID
      const section = item.closest("section[id]");
      const sectionId = section ? section.id : "pcb-design-rules";

      // Prefer the visible label text; fall back to the title attribute
      const labelEl = item.querySelector(".item-label");
      const labelText = labelEl ? labelEl.textContent : (item.getAttribute("title") || "");
      const labelSlug = slugify(labelText);

      // Set a stable deterministic ID compatible with deep links and tooling
      item.id = `${sectionId}__${labelSlug}`;
    });
  }

  function openRuleFromHash() {
	// Open and scroll to a rule item when the page is loaded via a hash.
	// Handles only rule-item hashes, leaving section hashes to native behavior.
	// Uses smooth scrolling with a small offset for sticky headers.
	// Read the current hash (without the leading '#')
    const hash = window.location.hash ? window.location.hash.substring(1) : "";
    if (!hash) return;

    // Locate the element targeted by the hash
    const target = document.getElementById(hash);
    if (!target) return;

    // If the hash points to a rule item, open it and scroll into view
    if (target.classList && target.classList.contains("has-detail")) {
      target.classList.add("open");

      // Scroll to the rule with a small offset for sticky headers (if any)
      // Use requestAnimationFrame so the browser can apply the "open" class first.
      // Defer scrolling until after the open state is applied
      requestAnimationFrame(() => {
        const y = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
      return;
    }

    // If the hash points to a section, do nothing special (native behavior already scrolls).
  }

  function openAllRulesByDefault() {
	// Expand all rule details so the page is fully readable by default.
	// Applies the same open state used by individual toggle behavior.
	// Provides a consistent baseline before deep links or bulk toggles run.
	// Mark every expandable item as open
	// Toggle the 'open' class on every expandable rule item
	document.querySelectorAll(".toggle-list .has-detail").forEach((item) => {
      item.classList.add("open");
    });
  }

  
  function getToggleAllStrings() {
	// Choose UI strings for the bulk toggle based on the current language.
	// Supports French and English without requiring external translation files.
	// Returns accessible labels used by injected per-section controls.
	// Detect page language to pick localized strings
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
	// Apply a uniform open/closed state across all expandable rule items.
	// Used by bulk toggle controls to expand or collapse in one action.
	// Relies on the existing CSS class to drive the visible UI state.
	// Toggle the 'open' class on every expandable rule item
    document.querySelectorAll(".toggle-list .has-detail").forEach((item) => {
      item.classList.toggle("open", !!isOpen);
    });
  }

  function getRuleItemsOpenState() {
	// Compute how many rule items exist and how many are currently open.
	// Determines whether the page is fully open, fully closed, or mixed.
	// Feeds state into UI syncing for bulk toggle checkboxes.
	// Collect items and summarize their open/closed distribution
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
	// Keep all bulk toggle checkboxes reflecting the current open state.
	// Handles empty pages by disabling controls and clearing mixed states.
	// Uses indeterminate state to represent a partially-open page.
	// Derive aggregate open state and apply it to every bulk control
    const state = getRuleItemsOpenState();
    // Find all bulk toggle checkboxes injected into headings
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
	// Insert bulk expand/collapse controls beside section headings.
	// Starts injecting from the 'Schematics' section onward in page order.
	// Wires events so bulk controls and individual toggles stay consistent.
	// Identify the section where bulk controls should begin appearing
    const schematicsH2 = document.querySelector("#pcb_design_rules_schematics > h2");
    if (!schematicsH2) return;

    // Walk headings in order and inject controls starting at 'Schematics'
    const h2s = Array.from(document.querySelectorAll("main.container section.card > h2"));
    let start = false;

    h2s.forEach((h2) => {
      if (h2 === schematicsH2) start = true;
      if (!start) return;

      // Avoid double-injecting controls if the script runs more than once
      if (h2.querySelector("[data-toggle-all-wrapper='true']")) return;

      // Build the inline wrapper UI next to the heading
      const wrapper = document.createElement("span");
      wrapper.setAttribute("data-toggle-all-wrapper", "true");
      wrapper.style.display = "inline-flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "0.4rem";
      wrapper.style.marginLeft = "0.75rem";
      wrapper.style.fontWeight = "normal";
      wrapper.style.fontSize = "0.9rem";
      wrapper.style.whiteSpace = "nowrap";

      // Create the checkbox that controls all rule items
      const box = document.createElement("input");
      box.type = "checkbox";
      box.setAttribute("data-toggle-all-rules", "true");
      const strings = getToggleAllStrings();
      box.setAttribute("aria-label", strings.aria);

      // Create the visible label beside the checkbox
      const label = document.createElement("span");
      label.textContent = strings.label;

      // Prevent checkbox clicks from triggering heading/item click handlers
      // Stop propagation so clicking the checkbox does not toggle rule items
      box.addEventListener("click", (e) => e.stopPropagation());

      // Apply bulk open/close changes and resync all controls
      box.addEventListener("change", () => {
        // Expand/collapse all items and keep every control in sync
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

    // Sync checkbox states immediately after injecting controls
    syncToggleAllCheckboxes();

    // Keep bulk controls synced when users toggle individual items (handled in main.js)
    // We update after any click on a rule item.
    // Keep bulk controls accurate after any individual rule item click.
    // Detect clicks within expandable items and then resync checkboxes.
    // Uses a frame delay so main.js can update classes first.
    document.addEventListener("click", (event) => {
      // Identify whether the click occurred within an expandable rule item
      const li = event.target && event.target.closest && event.target.closest(".toggle-list .has-detail");
      if (!li) return;

      // main.js toggles on the same click; wait one frame for the class to update
      // Wait one frame so the DOM reflects the toggled state before syncing controls
      requestAnimationFrame(syncToggleAllCheckboxes);
    });

    // Keep bulk controls synced when opening items via hash navigation
    // Resync bulk controls after hash-based opens/toggles
    window.addEventListener("hashchange", () => requestAnimationFrame(syncToggleAllCheckboxes));
  }


  // Initialize page enhancements once the DOM is ready.
  // Ensures IDs exist before using deep links and injecting controls.
  // Applies default expanded state for readability.
  document.addEventListener("DOMContentLoaded", () => {
    // Run initial setup steps in a safe, deterministic order
    ensureRuleIds();
    openAllRulesByDefault();   // <-- added
    openRuleFromHash();        // hash still works (and will scroll nicely)
    injectToggleAllControls();
  });

  // React to hash navigation so deep links always open the right item.
  // Re-check IDs in case content was injected after initial load.
  // Keeps the page behavior consistent without a full reload.
  window.addEventListener("hashchange", () => {
    // Refresh IDs and open the targeted rule on navigation
    // Ensure IDs exist even if some content was injected after load
    ensureRuleIds();
    openRuleFromHash();
  });
})();

/* ==========================================================================
   PCB Design Review Checklist Generator
   ========================================================================== */

(function () {
	"use strict";

	// Create stable, human-readable fragment IDs (used for deep links).
	function slugify(s) {
		return String(s)
			.toLowerCase()
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "") // strip accents
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.replace(/-{2,}/g, "-");
	}

	function escapeHtml(s) {
		return String(s)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	function collectChecklist() {
		const sections = [];
		const cards = document.querySelectorAll("main .card[id]");

		cards.forEach((card) => {
			const h2 = card.querySelector("h2");
			const list = card.querySelector("ul.toggle-list");

			if (!h2 || !list) return;

			// Build a per-item anchor that can be used to deep-link to the exact
			// rule on https://jak-services.github.io/en/pcb-design-rules.html
			//
			// IMPORTANT: The same ID algorithm must exist on the destination page
			// (implemented in main.js) so hashes resolve and auto-expand.
			const items = Array.from(list.querySelectorAll("li.has-detail"))
				.map((li, idx) => {
					const labelEl = li.querySelector(".item-label");
					const label = labelEl ? labelEl.textContent.trim() : "";
					if (!label) return null;

					const anchorId = `${card.id}__${slugify(label)}`;
					// Best effort: set ID on the live page too (useful for copy/paste sharing).
					if (!li.id) li.id = anchorId;

					return { label, anchorId, idx };
				})
				.filter(Boolean);

			if (!items.length) return;

			sections.push({
				title: h2.textContent.trim(),
				items
			});
		});

		return sections;
	}

	function buildHtmlDoc(sections) {
		const today = new Date().toISOString().slice(0, 10);
		const rulesBaseUrl = "https://jak-services.github.io/en/pcb-design-rules.html";

		const rows = sections.map((sec) => {
			const itemsHtml = sec.items.map((item, idx) => {
				const safe = escapeHtml(item.label);
				const id = "item_" + Math.random().toString(36).slice(2) + "_" + idx;
				const href = `${rulesBaseUrl}#${encodeURIComponent(item.anchorId)}`;

				return `
					<tr>
						<td class="check">
							<input type="checkbox" id="${id}"/>
						</td>
						<td class="rule">
							<label for="${id}">
								<a class="rule-link" href="${href}" target="_blank" rel="noopener noreferrer">${safe}</a>
							</label>
						</td>
						<td class="status">
							<select aria-label="Status for ${safe}">
								<option value="pass">Pass</option>
								<option value="fail">Fail</option>
								<option value="na">N/A</option>
							</select>
						</td>
						<td class="notes">
							<textarea class="notes-field" rows="2" placeholder="Notes / action items"></textarea>
							<div class="notes-print empty">Notes / action items</div>
						</td>
					</tr>
				`;
			}).join("");

			return `
				<section class="block">
					<h2>${escapeHtml(sec.title)}</h2>
					<table>
						<thead>
							<tr>
								<th>Done</th>
								<th>Check</th>
								<th>Status</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							${itemsHtml}
						</tbody>
					</table>
				</section>
			`;
		}).join("");

		return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8"/>
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		<title>PCB Design Review Checklist</title>
		<link rel="stylesheet" href="https://jak-services.github.io/css/design-review.css"/>
	</head>
	<body>
		<h1>PCB Design Review Checklist</h1>
		<p class="small" style="margin: 0 0 14px; opacity: 0.9;">
			Click the check items for detailed explanations.
		</p>

		<div class="actions">
			<button class="primary" onclick="window.print()">Print / Save as PDF</button>
		</div>

		<div class="meta">
			<div>
				<label>Project / Board name</label>
				<input type="text" placeholder="e.g., SensorHub Rev A"/>
			</div>
			<div>
				<label>Hardware revision</label>
				<input type="text" placeholder="e.g., A / B / C"/>
			</div>
			<div>
				<label>Reviewer</label>
				<input type="text" placeholder="Name"/>
			</div>
			<div>
				<label>Date</label>
				<input type="text" value="${today}"/>
			</div>
		</div>

		${rows}

		<p class="small">Generated from: ${escapeHtml(location.href)}</p>

		<script>
			(function () {
				"use strict";
				function autosize(el) {
					if (!el) return;
					el.style.height = "auto";
					// Add a couple of pixels to avoid clipping descenders in some print engines.
					el.style.height = (el.scrollHeight + 2) + "px";
				}
				function syncPrintMirror(el) {
					if (!el) return;
					const box = el.parentElement && el.parentElement.querySelector(".notes-print");
					if (!box) return;
					const val = (el.value || "");
					if (val.trim().length) {
						box.textContent = val;
						box.classList.remove("empty");
					} else {
						box.textContent = el.getAttribute("placeholder") || "";
						box.classList.add("empty");
					}
				}
				const areas = Array.from(document.querySelectorAll("textarea.notes-field"));
				areas.forEach((ta) => {
					autosize(ta);
					syncPrintMirror(ta);
					ta.addEventListener("input", () => {
						autosize(ta);
						syncPrintMirror(ta);
					});
				});
				// Ensure the print/PDF version has the latest content.
				window.addEventListener("beforeprint", () => areas.forEach((ta) => {
					autosize(ta);
					syncPrintMirror(ta);
				}));
			})();
		</script>
	</body>
</html>`;
	}

	function download(filename, text) {
		const blob = new Blob([text], { type: "text/html;charset=utf-8" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();

		a.remove();
		URL.revokeObjectURL(url);
	}

	function handleDownload() {
		const sections = collectChecklist();
		const doc = buildHtmlDoc(sections);
		const date = new Date().toISOString().slice(0, 10);
		download(`pcb-design-review-checklist_${date}.html`, doc);
	}

	function handlePrint() {
		window.print();
	}

	document.getElementById("download-design-review")
		?.addEventListener("click", handleDownload);

	document.getElementById("download-design-review-2")
		?.addEventListener("click", handleDownload);

	document.getElementById("print-design-review")
		?.addEventListener("click", handlePrint);

	document.getElementById("download-design-review-link")
	  ?.addEventListener("click", (e) => {
		e.preventDefault();
		handleDownload();
	  });
		
})();

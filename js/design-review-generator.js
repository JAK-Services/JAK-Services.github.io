/* ==========================================================================
   PCB Design Review Checklist Generator
   ========================================================================== */

(function () {
	"use strict";

	function onReady(fn) {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", fn, { once: true });
		} else {
			fn();
		}
	}

	function detectPageLang() {
		const htmlLang = (document.documentElement.getAttribute("lang") || "")
			.toLowerCase()
			.trim();
		if (htmlLang.startsWith("fr")) return "fr";
		if (htmlLang.startsWith("en")) return "en";
		if (location.pathname.includes("/fr/")) return "fr";
		return "en";
	}

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
			// rule on the rules page (language-specific).
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

	const I18N = {
		en: {
			htmlLang: "en",
			docTitle: "PCB Design Review Checklist",
			h1: "PCB Design Review Checklist",
			intro: "Click the check items for detailed explanations.",
			printBtn: "Print / Save as PDF",
			metaProject: "Project / Board name",
			metaProjectPh: "e.g., SensorHub Rev A",
			metaRev: "Hardware revision",
			metaRevPh: "e.g., A / B / C",
			metaReviewer: "Reviewer",
			metaReviewerPh: "Name",
			metaDate: "Date",
			thDone: "Done",
			thCheck: "Check",
			thStatus: "Status",
			thNotes: "Notes",
			ariaStatus: "Status for",
			optPass: "Pass",
			optFail: "Fail",
			optNA: "N/A",
			generatedFrom: "Generated from:"
		},
		fr: {
			htmlLang: "fr",
			docTitle: "Liste de revue de conception PCB",
			h1: "Liste de revue de conception PCB",
			intro: "Cliquez sur les éléments pour afficher les explications détaillées.",
			printBtn: "Imprimer / Enregistrer en PDF",
			metaProject: "Nom du projet / de la carte",
			metaProjectPh: "ex. SensorHub Rev A",
			metaRev: "Révision matérielle",
			metaRevPh: "ex. A / B / C",
			metaReviewer: "Relecteur",
			metaReviewerPh: "Nom",
			metaDate: "Date",
			thDone: "Fait",
			thCheck: "Vérification",
			thStatus: "Statut",
			thNotes: "Notes",
			ariaStatus: "Statut pour",
			optPass: "Réussi",
			optFail: "Échec",
			optNA: "N/A",
			generatedFrom: "Généré depuis :"
		}
	};

	function buildHtmlDoc(sections, options) {
		const opts = options || {};
		const lang = opts.lang === "fr" ? "fr" : "en";
		const t = I18N[lang];

		const today = new Date().toISOString().slice(0, 10);
		const rulesBaseUrl =
			opts.rulesBaseUrl ||
			(lang === "fr"
				? "https://jak-services.github.io/fr/pcb-design-rules.html"
				: "https://jak-services.github.io/en/pcb-design-rules.html");

		const rows = sections
			.map((sec) => {
				const itemsHtml = sec.items
					.map((item, idx) => {
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
							<select aria-label="${escapeHtml(t.ariaStatus)} ${safe}">
								<option value="pass">${escapeHtml(t.optPass)}</option>
								<option value="fail">${escapeHtml(t.optFail)}</option>
								<option value="na">${escapeHtml(t.optNA)}</option>
							</select>
						</td>
						<td class="notes">
							<div class="notes-field" contenteditable="true" role="textbox" aria-multiline="true"></div>
						</td>
					</tr>
				`;
					})
					.join("");

				return `
				<section class="block">
					<h2>${escapeHtml(sec.title)}</h2>
					<table class="design-review-table" style="width:100%;table-layout:fixed;border-collapse:collapse;">
						<colgroup>
							<col style="width:10%"/>
							<col style="width:30%"/>
							<col style="width:10%"/>
							<col style="width:50%"/>
						</colgroup>
						<thead>
							<tr>
								<th>${escapeHtml(t.thDone)}</th>
								<th>${escapeHtml(t.thCheck)}</th>
								<th>${escapeHtml(t.thStatus)}</th>
								<th>${escapeHtml(t.thNotes)}</th>
							</tr>
						</thead>
						<tbody>
							${itemsHtml}
						</tbody>
					</table>
				</section>
			`;
			})
			.join("");

		return `<!DOCTYPE html>
<html lang="${escapeHtml(t.htmlLang)}">
	<head>
		<meta charset="utf-8"/>
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		<title>${escapeHtml(t.docTitle)}</title>
		<link rel="stylesheet" href="https://jak-services.github.io/css/main.css"/>
		<link rel="stylesheet" href="https://jak-services.github.io/css/design-review.css"/>

		<style>
			/* Fallback essentials if external CSS fails to load */
			table.design-review-table{width:100%;table-layout:fixed;border-collapse:collapse;}
			table.design-review-table th, table.design-review-table td{border:1px solid #e5e7eb;vertical-align:top;padding:8px;}
			table.meta-table{width:100%;border-collapse:collapse;margin:0 0 16px;}
			table.meta-table td{padding:4px 8px;vertical-align:top;}
			table.meta-table input{width:100%;}
			td.rule a{display:block;white-space:normal;overflow-wrap:anywhere;word-break:break-word;}
			body {margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #ffffff; color: #1e1e1e; line-height: 1.5;}
			.btn { display: inline-block; padding: 0.55rem 1.2rem; border-radius: 999px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; text-decoration: none; background: transparent; }
			.btn.primary { background: #004f9e; color: #ffffff; }
			.btn.primary:hover { background: #003b75; }		
			.container { max-width: 1080px; margin: 0 auto; padding: 0 1rem; }	
			@media print { .actions { display: none !important; } }
		</style>
</head>
	<body>
		<div class="container">
		<h1>${escapeHtml(t.h1)}</h1>
		<p class="small" style="margin: 0 0 14px; opacity: 0.9;">
			${escapeHtml(t.intro)}
		</p>

		<div class="actions">
			<button class="btn primary" onclick="window.print()">${escapeHtml(t.printBtn)}</button>
		</div>

		<table class="meta-table" role="presentation">
			<tr>
				<td>
					<label>${escapeHtml(t.metaProject)}</label>
					<input type="text" placeholder="${escapeHtml(t.metaProjectPh)}"/>
				</td>
				<td>
					<label>${escapeHtml(t.metaRev)}</label>
					<input type="text" placeholder="${escapeHtml(t.metaRevPh)}"/>
				</td>
			</tr>
			<tr>
				<td>
					<label>${escapeHtml(t.metaReviewer)}</label>
					<input type="text" placeholder="${escapeHtml(t.metaReviewerPh)}"/>
				</td>
				<td>
					<label>${escapeHtml(t.metaDate)}</label>
					<input type="text" value="${today}"/>
				</td>
			</tr>
		</table>

		${rows}

		<p class="small">${escapeHtml(t.generatedFrom)} ${escapeHtml(location.href)}</p>

		</div>
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
		// Some browsers (Safari) can be picky if we revoke immediately.
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}

	function handleDownload(lang) {
		const sections = collectChecklist();
		const doc = buildHtmlDoc(sections, {
			lang: lang === "fr" ? "fr" : "en",
			rulesBaseUrl:
				lang === "fr"
					? "https://jak-services.github.io/fr/pcb-design-rules.html"
					: "https://jak-services.github.io/en/pcb-design-rules.html"
		});
		const date = new Date().toISOString().slice(0, 10);
		download(`pcb-design-review-checklist_${date}.html`, doc);
	}

	function handlePrint() {
		window.print();
	}

	onReady(() => {
		const pageLang = detectPageLang();

		function bindOnce(el, handler, opts) {
			if (!el || el.dataset.drBound === "1") return;
			el.dataset.drBound = "1";
			el.addEventListener("click", handler, opts);
		}

		// English triggers
		bindOnce(document.getElementById("download-design-review"), () => handleDownload("en"));

		bindOnce(document.getElementById("download-design-review-2"), () => handleDownload("en"));

		bindOnce(
			document.getElementById("download-design-review-link"),
			(e) => {
				e.preventDefault();
				handleDownload("en");
			},
			{ passive: false }
		);

		// French triggers
		bindOnce(document.getElementById("download-design-review-fr"), () => handleDownload("fr"));

		bindOnce(
			document.getElementById("download-design-review-fr-link"),
			(e) => {
				e.preventDefault();
				handleDownload("fr");
			},
			{ passive: false }
		);

		// If a page only has one set of IDs (or they changed), fall back to the page language.
		// (This makes the FR page still work even if it reuses the EN IDs, or vice versa.)
		// Fallback: if the page uses different IDs than expected, still bind any element
		// that looks like a design-review download control.
		document.querySelectorAll("[id^='download-design-review']").forEach((el) => {
			bindOnce(el, () => handleDownload(pageLang));
		});

		// Print trigger (if present on any page)
		bindOnce(document.getElementById("print-design-review"), handlePrint);
	});
})();

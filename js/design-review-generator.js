/* ==========================================================================
   PCB Design Review Checklist Generator
   ========================================================================== */

(function () {
	"use strict";

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

			const items = Array.from(list.querySelectorAll("li .item-label"))
				.map((el) => el.textContent.trim())
				.filter(Boolean);

			if (!items.length) return;

			sections.push({
				id: card.id,
				title: h2.textContent.trim(),
				items
			});
		});

		return sections;
	}

	function buildHtmlDoc(sections) {
		const today = new Date().toISOString().slice(0, 10);

		const rows = sections.map((sec) => {
			const secId = sec.id || slugify(sec.title);
			const itemsHtml = sec.items.map((label, idx) => {
				const safe = escapeHtml(label);
				const id = "item_" + Math.random().toString(36).slice(2) + "_" + idx;

				return `
					<tr>
						<td class="check">
							<input type="checkbox" id="${id}"/>
						</td>
						<td class="rule">
							<label for="${id}">
								<a class="rule-link" href="https://jak-services.github.io/en/pcb-design-rules.html#${secId}__${slugify(label)}" target="_blank" rel="noopener">${safe}</a>
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
							<textarea rows="2" placeholder="Notes / actions"></textarea>
						</td>
					</tr>
				`;
			}).join("");

			return `
				<section class="block">
					<h2>${escapeHtml(sec.title)}</h2>
					<table class="design-review-table">
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
			Detailed explanations for each check item below can be found by expanding the corresponding arrow node on
			<a href="https://jak-services.github.io/en/pcb-design-rules.html" target="_blank" rel="noopener noreferrer">this JAK Services page</a>.
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

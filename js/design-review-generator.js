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
				title: h2.textContent.trim(),
				items
			});
		});

		return sections;
	}

	function buildHtmlDoc(sections) {
		const today = new Date().toISOString().slice(0, 10);

		const rows = sections.map((sec) => {
			const itemsHtml = sec.items.map((label, idx) => {
				const safe = escapeHtml(label);
				const id = "item_" + Math.random().toString(36).slice(2) + "_" + idx;

				return `
					<tr>
						<td class="check">
							<input type="checkbox" id="${id}"/>
						</td>
						<td class="rule">
							<label for="${id}">${safe}</label>
						</td>
						<td class="status">
							<select aria-label="Status for ${safe}">
								<option value="pass">Pass</option>
								<option value="fail">Fail</option>
								<option value="na">N/A</option>
							</select>
						</td>
						<td class="notes">
							<input type="text" placeholder="Notes / action items"/>
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
		<style>
			body {
				font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
				margin: 24px;
			}
			h1 {
				margin: 0 0 8px;
				font-size: 22px;
			}
			.meta {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 12px;
				margin: 16px 0 24px;
			}
			.meta label {
				display: block;
				font-size: 12px;
				opacity: 0.8;
				margin-bottom: 4px;
			}
			.meta input {
				width: 100%;
				padding: 8px;
				border: 1px solid #ccc;
				border-radius: 10px;
			}
			.block {
				margin: 22px 0;
			}
			.block h2 {
				font-size: 16px;
				margin: 0 0 10px;
			}
			table {
				width: 100%;
				border-collapse: collapse;
			}
			th, td {
				border: 1px solid #ddd;
				padding: 8px;
				vertical-align: top;
			}
			th {
				background: #f6f6f6;
				text-align: left;
			}
			td.check {
				width: 56px;
				text-align: center;
			}
			td.status {
				width: 120px;
			}
			td.notes {
				width: 35%;
			}
			select,
			input[type="text"] {
				width: 100%;
				padding: 6px;
				border: 1px solid #ccc;
				border-radius: 8px;
			}
			.actions {
				display: flex;
				gap: 10px;
				margin: 0 0 18px;
			}
			.actions button {
				padding: 8px 12px;
				border-radius: 10px;
				border: 1px solid #ccc;
				background: #fff;
				cursor: pointer;
			}
			.actions button.primary {
				border-color: #111;
			}
			.small {
				font-size: 12px;
				opacity: 0.8;
				margin-top: 8px;
			}
			@media print {
				.actions {
					display: none;
				}
				body {
					margin: 12mm;
				}
				select,
				input[type="text"] {
					border: 1px solid #999;
				}
			}
		</style>
	</head>
	<body>
		<h1>PCB Design Review Checklist</h1>
		<p class="small" style="margin: 0 0 14px; opacity: 0.9;">For details on any check item, expand its corresponding node on <a href="https://jak-services.github.io/en/pcb-design-rules.html" target="_blank" rel="noopener noreferrer">this JAK Services page</a>.</p>

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
})();

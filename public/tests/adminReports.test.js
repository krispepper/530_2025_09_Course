/* Sai Manoj Naidu */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderAdminReports } from "../js/pages/adminReports.js";

function setupDom(url = "http://localhost/adminReports") {
  const dom = new JSDOM(
    `<div id="app-content"></div><div id="modal-root"></div>`,
    { url }
  );

  global.window = dom.window;
  global.document = dom.window.document;

  if (!dom.window.HTMLElement.prototype.scrollIntoView) {
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  }

  const immediateTimeout = (fn) => {
    fn();
    return 0;
  };
  global.setTimeout = immediateTimeout;
  dom.window.setTimeout = immediateTimeout;

  return dom;
}

/* ----------------------------------------------------
   TEST 1 — Admin Reports renders table + pagination
----------------------------------------------------- */
test("Admin Reports - renders a table with pagination summary", () => {
  const dom = setupDom();

  renderAdminReports();

  const tableRegion = document.querySelector(".admin-table-region");
  assert.ok(tableRegion, "admin table region should exist");

  const table = tableRegion.querySelector("table");
  assert.ok(table, "table should be rendered after skeleton");

  const pagination = tableRegion.querySelector(".admin-pagination");
  assert.ok(pagination, "pagination container should exist");

  const summary = pagination.querySelector(".pagination-summary");
  assert.ok(summary, "pagination summary text should exist");
  assert.ok(
    summary.textContent.includes("Showing"),
    "pagination summary should include 'Showing'"
  );
});

/* ----------------------------------------------------
   TEST 2 — Filter chips update and Clear all resets them
----------------------------------------------------- */
test("Admin Reports - filter chips reflect selections and Clear all resets them", () => {
  const dom = setupDom();
  renderAdminReports();

  const termSelect = document.getElementById("termFilter");
  const courseSelect = document.getElementById("courseFilter");
  const chipsRow = document.querySelector(".filter-chips-row");
  const clearBtn = document.querySelector(".btn-clear-filters");

  assert.ok(termSelect, "term select should exist");
  assert.ok(courseSelect, "course select should exist");
  assert.ok(chipsRow, "filter chips row should exist");
  assert.ok(clearBtn, "Clear all button should exist");

  assert.ok(
    chipsRow.textContent.includes("No filters applied"),
    "initial chips row should indicate no filters applied"
  );

  const termOptions = Array.from(termSelect.querySelectorAll("option"));
  const firstRealTerm = termOptions.find((opt) => opt.value && opt.value.trim() !== "");
  if (firstRealTerm) {
    termSelect.value = firstRealTerm.value;
    termSelect.dispatchEvent(
      new dom.window.Event("change", { bubbles: true })
    );
  }

  const chipsAfter = chipsRow.querySelectorAll(".filter-chip");
  if (firstRealTerm) {
    assert.ok(
      chipsAfter.length > 0,
      "chips row should show at least one filter chip after term selection"
    );
  }

  clearBtn.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  assert.ok(
    chipsRow.textContent.includes("No filters applied"),
    "chips row should reset to no filters applied after Clear all"
  );

  assert.equal(
    termSelect.value,
    "",
    "term select should be reset after Clear all"
  );
  assert.equal(
    courseSelect.value,
    "",
    "course select should be reset after Clear all"
  );
});

/* ----------------------------------------------------
   TEST 3 — Clicking a row opens a modal with details
----------------------------------------------------- */
test("Admin Reports - clicking a table row opens details modal", () => {
  const dom = setupDom();
  renderAdminReports();

  const table = document.querySelector(".admin-table-region table");
  assert.ok(table, "table should exist for admin reports");

  const firstRow = table.querySelector("tbody tr");
  assert.ok(firstRow, "there should be at least one data row");

  firstRow.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  const backdrop = document.querySelector(".modal-backdrop");
  const modal = document.querySelector(".admin-report-modal");

  assert.ok(backdrop, "modal backdrop should be added to DOM after row click");
  assert.ok(modal, "admin report modal should be shown after row click");

  const title = modal.querySelector("h3");
  assert.ok(title, "modal should have a title heading");

  const cards = modal.querySelectorAll(".side-panel-card");
  assert.ok(cards.length >= 1, "modal should contain at least one info card");

  const headingsText = Array.from(
    modal.querySelectorAll(".side-panel-card h4")
  ).map((h) => h.textContent);

  assert.ok(
    headingsText.some((t) => t.includes("Response count")),
    "modal should contain a 'Response count' section"
  );
});

/* ----------------------------------------------------
   TEST 4 — Modal close button hides the modal
----------------------------------------------------- */
test("Admin Reports - modal close button hides the modal", () => {
  const dom = setupDom();
  renderAdminReports();

  const table = document.querySelector(".admin-table-region table");
  assert.ok(table, "table should exist for admin reports");

  const firstRow = table.querySelector("tbody tr");
  assert.ok(firstRow, "there should be at least one data row");

  firstRow.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  let backdrop = document.querySelector(".modal-backdrop");
  let modal = document.querySelector(".admin-report-modal");
  assert.ok(backdrop, "modal backdrop should exist after row click");
  assert.ok(modal, "modal should exist after row click");

  const closeBtn = modal.querySelector(".modal-close");
  assert.ok(closeBtn, "modal close button should exist");

  closeBtn.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  backdrop = document.querySelector(".modal-backdrop");
  modal = document.querySelector(".admin-report-modal");

  assert.equal(backdrop, null, "modal backdrop should be removed after close");
  assert.equal(modal, null, "modal should be removed after close");
});

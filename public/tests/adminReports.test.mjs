/* Sai Manoj Naidu */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

global.fetch = async (url) => {
  if (url.includes("/api/auth/me")) {
    return {
      ok: true,
      json: async () => ({
        user: { id: 1, role: "admin", name: "Test Admin" }
      })
    };
  }

  return {
    ok: false,
    json: async () => ({})
  };
};

global.navigate = () => {};

const { renderAdminReports } = await import("../js/pages/adminReports.js");

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
test("Admin Reports - renders a table with pagination summary", async () => {
  setupDom();
  await renderAdminReports();

  const tableRegion = document.querySelector(".admin-table-region");
  assert.ok(tableRegion, "admin table region should exist");

  const table = tableRegion.querySelector("table");
  assert.ok(table, "table should be rendered after skeleton");

  const pagination = tableRegion.querySelector(".admin-pagination");
  assert.ok(pagination, "pagination container should exist");

  const summary = pagination.querySelector(".pagination-summary");
  assert.ok(summary, "pagination summary text should exist");
  assert.ok(summary.textContent.includes("Showing"));
});

/* ----------------------------------------------------
   TEST 2 — Filter chips update and Clear all resets them
----------------------------------------------------- */
test("Admin Reports - filter chips reflect selections and Clear all resets them", async () => {
  const dom = setupDom();
  await renderAdminReports();

  const termSelect = document.getElementById("termFilter");
  const courseSelect = document.getElementById("courseFilter");
  const chipsRow = document.querySelector(".filter-chips-row");
  const clearBtn = document.querySelector(".btn-clear-filters");

  assert.ok(termSelect);
  assert.ok(courseSelect);
  assert.ok(chipsRow);
  assert.ok(clearBtn);

  assert.ok(chipsRow.textContent.includes("No filters applied"));

  const termOptions = Array.from(termSelect.querySelectorAll("option"));
  const firstRealTerm = termOptions.find(
    (opt) => opt.value && opt.value.trim() !== ""
  );

  if (firstRealTerm) {
    termSelect.value = firstRealTerm.value;
    termSelect.dispatchEvent(
      new dom.window.Event("change", { bubbles: true })
    );
  }

  const chipsAfter = chipsRow.querySelectorAll(".filter-chip");
  if (firstRealTerm) {
    assert.ok(chipsAfter.length > 0);
  }

  clearBtn.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  assert.ok(chipsRow.textContent.includes("No filters applied"));
  assert.equal(termSelect.value, "");
  assert.equal(courseSelect.value, "");
});

/* ----------------------------------------------------
   TEST 3 — Clicking a row opens a modal with details
----------------------------------------------------- */
test("Admin Reports - clicking a table row opens details modal", async () => {
  const dom = setupDom();
  await renderAdminReports();

  const table = document.querySelector(".admin-table-region table");
  assert.ok(table);

  const firstRow = table.querySelector("tbody tr");
  assert.ok(firstRow);

  firstRow.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  const backdrop = document.querySelector(".modal-backdrop");
  const modal = document.querySelector(".admin-report-modal");

  assert.ok(backdrop);
  assert.ok(modal);

  const title = modal.querySelector("h3");
  assert.ok(title);

  const cards = modal.querySelectorAll(".side-panel-card");
  assert.ok(cards.length >= 1);

  const headingsText = Array.from(
    modal.querySelectorAll(".side-panel-card h4")
  ).map((h) => h.textContent);

  assert.ok(
    headingsText.some((t) => t.includes("Response count"))
  );
});

/* ----------------------------------------------------
   TEST 4 — Modal close button hides the modal
----------------------------------------------------- */
test("Admin Reports - modal close button hides the modal", async () => {
  const dom = setupDom();
  await renderAdminReports();

  const table = document.querySelector(".admin-table-region table");
  assert.ok(table);

  const firstRow = table.querySelector("tbody tr");
  assert.ok(firstRow);

  firstRow.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  let backdrop = document.querySelector(".modal-backdrop");
  let modal = document.querySelector(".admin-report-modal");

  assert.ok(backdrop);
  assert.ok(modal);

  const closeBtn = modal.querySelector(".modal-close");
  assert.ok(closeBtn);

  closeBtn.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true })
  );

  backdrop = document.querySelector(".modal-backdrop");
  modal = document.querySelector(".admin-report-modal");

  assert.equal(backdrop, null);
  assert.equal(modal, null);
});

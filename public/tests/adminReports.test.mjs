/* Sai Manoj Naidu */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const mockCourses = [
  {
    _id: "c1",
    courseName: "Software Development",
    section: "001",
    term: "Spring 2026",
    updatedAt: new Date().toISOString()
  },
  {
    _id: "c2",
    courseName: "Mathematics",
    section: "002",
    term: "Spring 2026",
    updatedAt: new Date().toISOString()
  }
];

const mockEvaluations = [
  {
    _id: "e1",
    title: "Course Evaluation - Software Development",
    evaluationType: "course",
    isActive: true,
    course: { _id: "c1" }
  }
];

const mockResults = {
  evaluation: { _id: "e1" },
  responses: [
    {
      _id: "r1",
      submittedAt: new Date().toISOString(),
      submittedBy: { fullName: "Student One", email: "student1@gmail.com" },
      answers: [{ questionText: "Q1", answerValue: "5" }]
    }
  ]
};

global.fetch = async (url) => {
  if (url.includes("/api/auth/me")) {
    return {
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        user: { id: 1, role: "admin", name: "Test Admin" }
      })
    };
  }

  if (url.includes("/api/courses")) {
    return {
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ count: mockCourses.length, courses: mockCourses })
    };
  }

  if (url === "/api/evaluations") {
    return {
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ evaluations: mockEvaluations })
    };
  }

  const resultsMatch = url.match(/\/api\/evaluations\/([^/]+)\/results/);
  if (resultsMatch) {
    return {
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockResults
    };
  }

  return {
    ok: false,
    headers: new Map([["content-type", "application/json"]]),
    json: async () => ({ message: "Not mocked: " + url })
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
  await renderAdminReports(() => {});

  const tableRegion = document.querySelector(".admin-table-region");
  assert.ok(tableRegion, "admin table region should exist");

  const table = tableRegion.querySelector("table");
  assert.ok(table, "table should be rendered");

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
  await renderAdminReports(() => {});

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
  const firstRealTerm = termOptions.find((opt) => opt.value && opt.value.trim() !== "");

  assert.ok(firstRealTerm, "should have at least one term option");

  termSelect.value = firstRealTerm.value;
  termSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

  const chipsAfter = chipsRow.querySelectorAll(".filter-chip");
  assert.ok(chipsAfter.length > 0, "chips should appear after selecting a term");

  clearBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

  assert.ok(chipsRow.textContent.includes("No filters applied"));
  assert.equal(termSelect.value, "");
  assert.equal(courseSelect.value, "");
});

/* ----------------------------------------------------
   TEST 3 — View Evaluations opens modal
----------------------------------------------------- */
test("Admin Reports - clicking View Evaluations opens evaluations modal", async () => {
  const dom = setupDom();
  await renderAdminReports(() => {});

  const table = document.querySelector(".admin-table-region table");
  assert.ok(table);

  const viewBtns = table.querySelectorAll("button");
  const firstViewBtn = Array.from(viewBtns).find((b) => b.textContent.includes("View Evaluations"));
  assert.ok(firstViewBtn, "View Evaluations button should exist");

  firstViewBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

  const backdrop = document.querySelector(".modal-backdrop");
  const modal = document.querySelector(".admin-report-modal");
  assert.ok(backdrop);
  assert.ok(modal);

  const title = modal.querySelector("h3");
  assert.ok(title);
  assert.ok(title.textContent.includes("Evaluations"));
});

/* ----------------------------------------------------
   TEST 4 — Modal close button hides the modal
----------------------------------------------------- */
test("Admin Reports - modal close button hides the modal", async () => {
  const dom = setupDom();
  await renderAdminReports(() => {});

  const table = document.querySelector(".admin-table-region table");
  assert.ok(table);

  const firstViewBtn = Array.from(table.querySelectorAll("button")).find((b) =>
    b.textContent.includes("View Evaluations")
  );
  assert.ok(firstViewBtn);

  firstViewBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

  let modal = document.querySelector(".admin-report-modal");
  assert.ok(modal);

  const closeBtn = modal.querySelector(".modal-close");
  assert.ok(closeBtn);

  closeBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

  const backdropAfter = document.querySelector(".modal-backdrop");
  const modalAfter = document.querySelector(".admin-report-modal");
  assert.equal(backdropAfter, null);
  assert.equal(modalAfter, null);
});

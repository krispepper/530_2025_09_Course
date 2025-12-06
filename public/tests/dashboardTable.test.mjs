/* Sohini Singaram */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { mockEnrollmentsForTest } from "./testData.mjs";

const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;

function createElement(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent !== undefined) el.textContent = textContent;
  return el;
}

function createTable(columns = [], data = []) {
  if (!data || data.length === 0) return null;

  const wrapper = createElement("div", "table-wrapper");
  const table = createElement("table", "table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  data.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((col) => {
      const td = document.createElement("td");
      if (col.render) {
        td.appendChild(col.render(row));
      } else {
        td.textContent = row[col.key];
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

/* ----------------------------------------------------
   TEST — Dashboard Table Rendering
----------------------------------------------------- */
test("Dashboard Table - renders correct number of rows and values", () => {
  const columns = [
    { key: "course", label: "Course" },
    { key: "instructor", label: "Instructor" },
    { key: "term", label: "Term" },
    { key: "status", label: "Status" }
  ];

  const table = createTable(columns, mockEnrollmentsForTest);

  assert.ok(table, "Table should be created");

  const rows = table.querySelectorAll("tbody tr");
  assert.equal(
    rows.length,
    mockEnrollmentsForTest.length,
    "Row count should match test data length"
  );

  assert.ok(
    table.innerHTML.includes("Introduction to Computer Science"),
    "Expected course name should appear in table"
  );
});

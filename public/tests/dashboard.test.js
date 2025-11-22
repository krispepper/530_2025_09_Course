import { JSDOM } from "jsdom";
import { mockEnrollmentsForTest } from "./testData.js";

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

  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

function testDashboardTableRendersCorrectly() {
  console.log("\n--- Running: Dashboard Table Rendering Test ---");

  const columns = [
    { key: "course", label: "Course" },
    { key: "instructor", label: "Instructor" },
    { key: "term", label: "Term" },
    { key: "status", label: "Status" }
  ];

  const table = createTable(columns, mockEnrollmentsForTest);

  if (!table) {
    console.error("FAIL: Table was not created.");
    return;
  }

  const rows = table.querySelectorAll("tbody tr");
  if (rows.length !== mockEnrollmentsForTest.length) {
    console.error(
      `FAIL: Expected ${mockEnrollmentsForTest.length} rows, got ${rows.length}.`
    );
    return;
  }
  if (!table.innerHTML.includes("Introduction to Computer Science")) {
    console.error("FAIL: Expected course name not found in table HTML.");
    return;
  }

  console.log("PASS: Dashboard table rendered correctly.");
}
testDashboardTableRendersCorrectly();

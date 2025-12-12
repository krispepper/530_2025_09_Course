import { createElement } from "./domUtils.js";

export function createTable(columns = [], data = []) {
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

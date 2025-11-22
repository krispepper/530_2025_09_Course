import { $, createElement } from "../components/domUtils.js";
import { createSelect } from "../components/select.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { mockEvaluationSummaries } from "../data/mockEvaluationSummaries.js";

export function renderAdminReports() {
  const content = $("#app-content");
  content.innerHTML = "";

  const wrapper = createElement("div", "admin-reports");


  const filtersRow = createElement("div", "filters-row");

  const uniqueTerms = Array.from(
    new Set(mockEvaluationSummaries.map((e) => e.term))
  );
  const uniqueCourses = Array.from(
    new Set(mockEvaluationSummaries.map((e) => e.course))
  );

  let selectedTerm = "";
  let selectedCourse = "";

  const termSelect = createSelect({
    label: "Term",
    id: "termFilter",
    options: [
      { value: "", label: "All Terms" },
      ...uniqueTerms.map((t) => ({ value: t, label: t }))
    ],
    onChange: (val) => {
      selectedTerm = val;
      showSkeletonThenUpdate();
    }
  });

  const courseSelect = createSelect({
    label: "Course",
    id: "courseFilter",
    options: [
      { value: "", label: "All Courses" },
      ...uniqueCourses.map((c) => ({ value: c, label: c }))
    ],
    onChange: (val) => {
      selectedCourse = val;
      showSkeletonThenUpdate();
    }
  });

  filtersRow.appendChild(termSelect);
  filtersRow.appendChild(courseSelect);

  const skeleton = createElement("div", "skeleton-wrapper");
  for (let i = 0; i < 4; i++) {
    const row = createElement("div", "skeleton-row");
    skeleton.appendChild(row);
  }

  const emptyState = createElement(
    "div",
    "empty-state",
    "No evaluations match your filters."
  );
  emptyState.style.display = "none";

  const tableRegion = createElement("div", "admin-table-region");

  wrapper.appendChild(filtersRow);
  wrapper.appendChild(skeleton);
  wrapper.appendChild(emptyState);
  wrapper.appendChild(tableRegion);

  const card = createCard("Admin Evaluation Reports", wrapper);
  content.appendChild(card);

  function applyFilters() {
    return mockEvaluationSummaries.filter((item) => {
      const byTerm = selectedTerm ? item.term === selectedTerm : true;
      const byCourse = selectedCourse ? item.course === selectedCourse : true;
      return byTerm && byCourse;
    });
  }

  function renderTable() {
    const filtered = applyFilters();

    tableRegion.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    const columns = [
      { key: "course", label: "Course" },
      { key: "section", label: "Section" },
      { key: "submissions", label: "Submissions" },
      { key: "lastUpdated", label: "Last Updated" }
    ];

    const table = createTable(columns, filtered);
    if (table) {
      tableRegion.appendChild(table);
    }
  }

  function showSkeletonThenUpdate() {
    skeleton.style.display = "block";
    tableRegion.innerHTML = "";
    emptyState.style.display = "none";

    setTimeout(() => {
      skeleton.style.display = "none";
      renderTable();
    }, 600);
  }

  showSkeletonThenUpdate();
}

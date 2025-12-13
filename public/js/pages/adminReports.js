import { $, createElement } from "../components/domUtils.js";
import { createSelect } from "../components/select.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { authService } from "../services/authService.js";
import { courseService } from "../services/courseService.js";
import { evaluationService } from "../services/evaluationService.js";
import { showLargeModal } from "../components/modal.js";
import { renderEvaluate } from "./evaluationForm.js";

export async function renderAdminReports(navigate) {
  const go = typeof navigate === "function" ? navigate : () => {};

  const user = await authService.getCurrentUser();
  if (!user || user.role !== "admin") {
    go("/dashboard");
    return;
  }

  const content = $("#app-content");
  content.innerHTML = "";

  const wrapper = createElement("div", "admin-reports");
  const modalRoot = $("#modal-root");

  let coursesRes;
  try {
    coursesRes = await courseService.getAllCourses();
  } catch (err) {
    content.appendChild(
      createCard(
        "Admin Evaluation Reports",
        createElement("p", "empty-state", err?.message || "Failed to load courses")
      )
    );
    return;
  }

  const allCourses = coursesRes?.courses || [];
  const terms = Array.from(
    new Set(allCourses.map((c) => (c.term || "").trim()).filter(Boolean))
  );
  const courseNames = Array.from(
    new Set(allCourses.map((c) => (c.courseName || "").trim()).filter(Boolean))
  );

  let selectedTerm = "";
  let selectedCourse = "";
  let currentPage = 1;
  const pageSize = 6;

  const filtersRow = createElement("div", "filters-row");

  const termSelect = createSelect({
    label: "Term",
    id: "termFilter",
    options: [{ value: "", label: "All Terms" }, ...terms.map((t) => ({ value: t, label: t }))],
    onChange: (val) => {
      selectedTerm = val;
      currentPage = 1;
      renderTable();
    }
  });

  const courseSelect = createSelect({
    label: "Course",
    id: "courseFilter",
    options: [{ value: "", label: "All Courses" }, ...courseNames.map((c) => ({ value: c, label: c }))],
    onChange: (val) => {
      selectedCourse = val;
      currentPage = 1;
      renderTable();
    }
  });

  filtersRow.appendChild(termSelect);
  filtersRow.appendChild(courseSelect);

  const chipsRow = createElement("div", "filter-chips-row");
  const clearFiltersWrapper = createElement("div", "clear-filters-wrapper");
  const clearFiltersBtn = createElement("button", "btn-clear-filters", "Clear all");

  clearFiltersBtn.type = "button";
  clearFiltersBtn.addEventListener("click", () => {
    selectedTerm = "";
    selectedCourse = "";
    currentPage = 1;

    const termSelectEl = document.getElementById("termFilter");
    const courseSelectEl = document.getElementById("courseFilter");
    if (termSelectEl) termSelectEl.value = "";
    if (courseSelectEl) courseSelectEl.value = "";

    updateFilterChips();
    renderTable();
  });

  clearFiltersWrapper.appendChild(clearFiltersBtn);

  const emptyState = createElement("div", "empty-state", "No courses match your filters.");
  emptyState.style.display = "none";

  const tableRegion = createElement("div", "admin-table-region");

  wrapper.appendChild(filtersRow);
  wrapper.appendChild(chipsRow);
  wrapper.appendChild(clearFiltersWrapper);
  wrapper.appendChild(emptyState);
  wrapper.appendChild(tableRegion);

  content.appendChild(createCard("Admin Evaluation Reports", wrapper));

  function applyFilters() {
    return allCourses.filter((c) => {
      const byTerm = selectedTerm ? String(c.term || "").trim() === selectedTerm : true;
      const byCourse = selectedCourse ? String(c.courseName || "").trim() === selectedCourse : true;
      return byTerm && byCourse;
    });
  }

  function updateFilterChips() {
    chipsRow.innerHTML = "";

    if (!selectedTerm && !selectedCourse) {
      chipsRow.appendChild(createElement("span", "filter-chip-empty", "No filters applied"));
      return;
    }

    if (selectedTerm) {
      chipsRow.appendChild(
        createChip("Term", selectedTerm, () => {
          selectedTerm = "";
          const termSelectEl = document.getElementById("termFilter");
          if (termSelectEl) termSelectEl.value = "";
          currentPage = 1;
          updateFilterChips();
          renderTable();
        })
      );
    }

    if (selectedCourse) {
      chipsRow.appendChild(
        createChip("Course", selectedCourse, () => {
          selectedCourse = "";
          const courseSelectEl = document.getElementById("courseFilter");
          if (courseSelectEl) courseSelectEl.value = "";
          currentPage = 1;
          updateFilterChips();
          renderTable();
        })
      );
    }
  }

  function createChip(label, value, onClear) {
    const chip = createElement("button", "filter-chip");
    chip.type = "button";

    const spanLabel = createElement("span", "filter-chip-label", `${label}: `);
    const spanValue = createElement("span", "filter-chip-value", value);
    const spanClose = createElement("span", "filter-chip-close", "×");

    spanClose.addEventListener("click", (e) => {
      e.stopPropagation();
      onClear();
    });

    chip.appendChild(spanLabel);
    chip.appendChild(spanValue);
    chip.appendChild(spanClose);
    chip.addEventListener("click", onClear);
    return chip;
  }

  function renderTable() {
    updateFilterChips();

    const filtered = applyFilters();
    tableRegion.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageItems = filtered.slice(startIndex, endIndex);

    const rows = pageItems.map((c) => ({
      _id: c._id,
      course: c.courseName,
      section: c.section || "N/A",
      term: c.term || "N/A",
      lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "—",
      actions: "Actions"
    }));

    const columns = [
      { key: "course", label: "Course" },
      { key: "section", label: "Section" },
      { key: "term", label: "Term" },
      { key: "lastUpdated", label: "Last Updated" },
      { key: "actions", label: "Actions" }
    ];

    const table = createTable(columns, rows);

    const tbodyRows = table.querySelectorAll("tbody tr");
    tbodyRows.forEach((rowEl, idx) => {
      const record = rows[idx];
      rowEl.lastChild.innerHTML = "";

      const viewBtn = createElement("button", "btn-sm", "View Evaluations");
      viewBtn.type = "button";
      viewBtn.addEventListener("click", () => openEvaluationsModal(record));

      rowEl.lastChild.appendChild(viewBtn);
    });

    tableRegion.appendChild(table);
    tableRegion.appendChild(
      createPaginationControls(currentPage, totalPages, totalItems, startIndex + 1, Math.min(endIndex, totalItems))
    );
  }

  function createPaginationControls(current, totalPages, totalItems, startDisplay, endDisplay) {
    const container = createElement("div", "admin-pagination");

    const summary = createElement("div", "pagination-summary", `Showing ${startDisplay}–${endDisplay} of ${totalItems}`);
    const controls = createElement("div", "pagination-controls");

    const prevBtn = createElement("button", "pagination-btn", "Previous");
    prevBtn.type = "button";
    prevBtn.disabled = current === 1;
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderTable();
      }
    });

    const pageInfo = createElement("span", "pagination-page-info", `Page ${current} of ${totalPages}`);

    const nextBtn = createElement("button", "pagination-btn", "Next");
    nextBtn.type = "button";
    nextBtn.disabled = current === totalPages;
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderTable();
      }
    });

    controls.appendChild(prevBtn);
    controls.appendChild(pageInfo);
    controls.appendChild(nextBtn);

    container.appendChild(summary);
    container.appendChild(controls);
    return container;
  }

  async function openEvaluationsModal(courseRecord) {
    if (!modalRoot) return;
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal admin-report-modal");

    const header = createElement("div", "modal-header");
    const title = createElement("h3", null, `${courseRecord.course} — Evaluations`);
    const closeBtn = createElement("button", "modal-close", "×");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", () => (modalRoot.innerHTML = ""));
    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = createElement("div", "modal-body");
    body.appendChild(createElement("p", "modal-subtitle", `Term: ${courseRecord.term} | Section: ${courseRecord.section}`));

    const loading = createElement("p", "side-panel-text", "Loading evaluations...");
    body.appendChild(loading);

    modal.appendChild(header);
    modal.appendChild(body);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) modalRoot.innerHTML = "";
    });

    let evalRes;
    try {
      evalRes = await evaluationService.listEvaluations();
    } catch (err) {
      loading.textContent = err?.data?.message || err?.message || "Failed to load evaluations";
      return;
    }

    const allEvals = evalRes?.evaluations || [];
    const courseEvals = allEvals.filter((ev) => String(ev.course?._id || ev.course) === String(courseRecord._id));

    body.innerHTML = "";
    body.appendChild(createElement("p", "modal-subtitle", `Term: ${courseRecord.term} | Section: ${courseRecord.section}`));

    if (courseEvals.length === 0) {
      body.appendChild(createElement("p", "side-panel-text", "No evaluations found for this course."));
      return;
    }

    const list = createElement("div", "admin-eval-list");
    courseEvals.forEach((ev) => {
      const row = createElement("div", "admin-eval-item");

      const left = createElement("div", "admin-eval-left");
      left.appendChild(createElement("div", "admin-eval-title", ev.title || "Evaluation"));
      left.appendChild(
        createElement(
          "div",
          "admin-eval-meta",
          `Type: ${ev.evaluationType} | Active: ${ev.isActive ? "Yes" : "No"}`
        )
      );

      const right = createElement("div", "admin-eval-right");
      const btn = createElement("button", "btn-sm", "View Submissions");
      btn.type = "button";
      btn.addEventListener("click", () => openSubmissionsModal(ev));
      right.appendChild(btn);

      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });

    body.appendChild(list);
  }

  async function openSubmissionsModal(evaluation) {
    if (!modalRoot) return;
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal admin-report-modal");

    const header = createElement("div", "modal-header");
    const title = createElement("h3", null, `Submissions — ${evaluation.title || "Evaluation"}`);
    const closeBtn = createElement("button", "modal-close", "×");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", () => (modalRoot.innerHTML = ""));
    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = createElement("div", "modal-body");
    body.appendChild(createElement("p", "side-panel-text", "Loading submissions..."));

    modal.appendChild(header);
    modal.appendChild(body);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) modalRoot.innerHTML = "";
    });

    let results;
    try {
      results = await evaluationService.getResults(evaluation._id);
    } catch (err) {
      body.innerHTML = "";
      body.appendChild(
        createElement("p", "side-panel-text", err?.data?.message || err?.message || "Failed to load results")
      );
      return;
    }

    const responses = results?.responses || [];
    body.innerHTML = "";

    if (responses.length === 0) {
      body.appendChild(createElement("p", "side-panel-text", "No submissions yet."));
      return;
    }

    const rows = responses.map((r) => {
      const submittedBy = r.submittedBy || null;
      const studentName = submittedBy?.fullName || submittedBy?.name || submittedBy?.email || "Anonymous / Hidden";

      return {
        responseId: r._id,
        student: studentName,
        submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—",
        action: "Action",
        _raw: r
      };
    });

    const columns = [
      { key: "student", label: "Student" },
      { key: "submittedAt", label: "Submitted At" },
      { key: "action", label: "Action" }
    ];

    const table = createTable(columns, rows);

    const tbodyRows = table.querySelectorAll("tbody tr");
    tbodyRows.forEach((rowEl, idx) => {
      const record = rows[idx];
      rowEl.lastChild.innerHTML = "";

      const viewBtn = createElement("button", "btn-sm", "View");
      viewBtn.type = "button";

      viewBtn.addEventListener("click", async () => {
        const mount = document.createElement("div");

        try {
          await renderEvaluate(
            () => {},
            {
              evaluationId: results.evaluation._id,
              responseId: record._raw._id,
              mode: "adminView",
              mountNode: mount
            }
          );

          showLargeModal(
            "View Submitted Evaluation",
            mount,
            () => {}, 
            "Back to Reports"
          );
        } catch (e) {
          showLargeModal(
            "Failed to open evaluation",
            createElement("p", "side-panel-text", e?.message || "Please try again."),
            () => {},
            "Back to Reports"
          );
        }
      });

      rowEl.lastChild.appendChild(viewBtn);
    });

    body.appendChild(table);
  }

  renderTable();
}

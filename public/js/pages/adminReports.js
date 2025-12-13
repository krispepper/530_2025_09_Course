import { $, createElement } from "../components/domUtils.js";
import { createSelect } from "../components/select.js";
import { createCard } from "../components/card.js";
<<<<<<< Updated upstream
import { createTable } from "../components/table.js";
import { mockEvaluationSummaries } from "../data/mockEvaluationSummaries.js";
import { authService } from "../services/authService.js";

export async function renderAdminReports() {
  const user = await authService.getCurrentUser();

  if (!user || user.role !== "admin") {
    navigate("/dashboard");
    return;
  }
=======
import { createTable } from "../components/table.js";
import { evaluationListService } from "../services/evaluationListService.js";
import { evaluationService } from "../services/evaluationService.js";
import { authService } from "../services/authService.js";

export async function renderAdminReports(navigate) {
  const go = typeof navigate === "function" ? navigate : (p) => (window.history.pushState({}, "", p), window.dispatchEvent(new PopStateEvent("popstate")));
  const user = await authService.getCurrentUser();

  if (!user || user.role !== "admin") {
    go("/dashboard");
    return;
  }
>>>>>>> Stashed changes
  const content = $("#app-content");
  content.innerHTML = "";

  const wrapper = createElement("div", "admin-reports");

<<<<<<< Updated upstream
  const modalRoot = $("#modal-root");

  const uniqueTerms = Array.from(
    new Set(mockEvaluationSummaries.map((e) => e.term))
  );
  const uniqueCourses = Array.from(
    new Set(mockEvaluationSummaries.map((e) => e.course))
  );

  let selectedTerm = "";
  let selectedCourse = "";
=======
  const modalRoot = $("#modal-root");

  function termFromDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const t = m >= 1 && m <= 5 ? "Spring" : m >= 6 && m <= 8 ? "Summer" : "Fall";
    return `${t} ${y}`;
  }

  const api = await evaluationListService.getMyEvaluations();
  const evals = api?.evaluations || [];
  const records = evals.map((ev) => ({
    evaluationId: ev._id,
    term: termFromDate(ev.startDate),
    courseId: ev.course?._id || "",
    course: ev.course?.courseName || "",
    section: ev.course?.courseCode || "",
    submissions: null,
    lastUpdated: null
  }));

  const uniqueTerms = Array.from(new Set(records.map((e) => e.term).filter(Boolean)));
  const uniqueCourses = Array.from(new Set(records.map((e) => e.course).filter(Boolean)));

  let selectedTerm = "";
  let selectedCourse = "";
  let initialEvaluationId = "";

  // Seed filters from URL params if provided
  try {
    const params = new URLSearchParams(window.location.search);
    const courseParam = params.get("course");
    const termParam = params.get("term");
    const evalParam = params.get("evaluationId");
    if (courseParam) selectedCourse = courseParam;
    if (termParam) selectedTerm = termParam;
    if (evalParam) initialEvaluationId = String(evalParam);
  } catch {}
>>>>>>> Stashed changes

  let currentPage = 1;
  const pageSize = 5; 

  const filtersRow = createElement("div", "filters-row");

<<<<<<< Updated upstream
  const termSelect = createSelect({
    label: "Term",
    id: "termFilter",
    options: [
      { value: "", label: "All Terms" },
      ...uniqueTerms.map((t) => ({ value: t, label: t }))
    ],
    onChange: (val) => {
      selectedTerm = val;
      currentPage = 1;
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
      currentPage = 1;
      showSkeletonThenUpdate();
    }
  });

  filtersRow.appendChild(termSelect);
  filtersRow.appendChild(courseSelect);
=======
  const termSelect = createSelect({
    label: "Term",
    id: "termFilter",
    options: [
      { value: "", label: "All Terms" },
      ...uniqueTerms.map((t) => ({ value: t, label: t }))
    ],
    onChange: (val) => {
      selectedTerm = val;
      currentPage = 1;
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
      currentPage = 1;
      showSkeletonThenUpdate();
    }
  });

  filtersRow.appendChild(termSelect);
  filtersRow.appendChild(courseSelect);

  // Apply initial selections from URL if present
  const termSelectEl = () => document.getElementById("termFilter");
  const courseSelectEl = () => document.getElementById("courseFilter");
  queueMicrotask(() => {
    if (selectedTerm && termSelectEl()) termSelectEl().value = selectedTerm;
    if (selectedCourse && courseSelectEl()) courseSelectEl().value = selectedCourse;
  });
>>>>>>> Stashed changes

  const chipsRow = createElement("div", "filter-chips-row");
  const clearFiltersWrapper = createElement("div", "clear-filters-wrapper");
  const clearFiltersBtn = createElement(
    "button",
    "btn-clear-filters",
    "Clear all"
  );

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
    showSkeletonThenUpdate();
  });

  clearFiltersWrapper.appendChild(clearFiltersBtn);

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
  wrapper.appendChild(chipsRow);
  wrapper.appendChild(clearFiltersWrapper);
  wrapper.appendChild(skeleton);
  wrapper.appendChild(emptyState);
  wrapper.appendChild(tableRegion);

  const card = createCard("Admin Evaluation Reports", wrapper);
  content.appendChild(card);


<<<<<<< Updated upstream
  function applyFilters() {
    return mockEvaluationSummaries.filter((item) => {
      const byTerm = selectedTerm ? item.term === selectedTerm : true;
      const byCourse = selectedCourse ? item.course === selectedCourse : true;
      return byTerm && byCourse;
    });
  }
=======
  function applyFilters() {
    return records.filter((item) => {
      const byTerm = selectedTerm ? item.term === selectedTerm : true;
      const byCourse = selectedCourse ? item.course === selectedCourse : true;
      return byTerm && byCourse;
    });
  }
>>>>>>> Stashed changes

  function updateFilterChips() {
    chipsRow.innerHTML = "";

    if (!selectedTerm && !selectedCourse) {
      const none = createElement("span", "filter-chip-empty", "No filters applied");
      chipsRow.appendChild(none);
      return;
    }

    if (selectedTerm) {
      const chip = createFilterChip("Term", selectedTerm, () => {
        selectedTerm = "";
        const termSelectEl = document.getElementById("termFilter");
        if (termSelectEl) termSelectEl.value = "";
        currentPage = 1;
        updateFilterChips();
        showSkeletonThenUpdate();
      });
      chipsRow.appendChild(chip);
    }

    if (selectedCourse) {
      const chip = createFilterChip("Course", selectedCourse, () => {
        selectedCourse = "";
        const courseSelectEl = document.getElementById("courseFilter");
        if (courseSelectEl) courseSelectEl.value = "";
        currentPage = 1;
        updateFilterChips();
        showSkeletonThenUpdate();
      });
      chipsRow.appendChild(chip);
    }
  }

  function createFilterChip(label, value, onClear) {
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

<<<<<<< Updated upstream
  function renderTable() {
    const filtered = applyFilters();
=======
  async function renderTable() {
    const filtered = applyFilters();
>>>>>>> Stashed changes

    tableRegion.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
<<<<<<< Updated upstream
    const pageItems = filtered.slice(startIndex, endIndex);
=======
    const pageItems = filtered.slice(startIndex, endIndex);

    const pageWithStats = await Promise.all(
      pageItems.map(async (rec) => {
        if (!rec.evaluationId) return rec;
        try {
          const res = await evaluationService.getResults(rec.evaluationId);
          const total = res?.totalResponses ?? 0;
          const latest = (res?.responses || [])[0]?.submittedAt || null;
          return {
            ...rec,
            submissions: String(total),
            lastUpdated: latest ? new Date(latest).toISOString().slice(0, 10) : ""
          };
        } catch {
          return { ...rec, submissions: "0", lastUpdated: "" };
        }
      })
    );
>>>>>>> Stashed changes

    const columns = [
      { key: "course", label: "Course" },
      { key: "section", label: "Section" },
      { key: "submissions", label: "Submissions" },
      { key: "lastUpdated", label: "Last Updated" }
    ];

<<<<<<< Updated upstream
    const table = createTable(columns, pageItems);

    if (table) {
      const tbodyRows = table.querySelectorAll("tbody tr");
      tbodyRows.forEach((rowEl, idx) => {
        const record = pageItems[idx];
        rowEl.classList.add("clickable-row");

        rowEl.addEventListener("click", () => {
          openDetailsModal(record);
        });
      });

      tableRegion.appendChild(table);
    }
=======
  const table = createTable(columns, pageWithStats);

    if (table) {
      const tbodyRows = table.querySelectorAll("tbody tr");
      tbodyRows.forEach((rowEl, idx) => {
        const record = pageWithStats[idx];
        rowEl.classList.add("clickable-row");

        rowEl.addEventListener("click", () => {
          openDetailsModal(record);
        });
      });

      tableRegion.appendChild(table);
    }
>>>>>>> Stashed changes

    const pagination = createPaginationControls(
      currentPage,
      totalPages,
      totalItems,
      startIndex + 1,
      Math.min(endIndex, totalItems)
    );
<<<<<<< Updated upstream
    tableRegion.appendChild(pagination);
  }
=======
    tableRegion.appendChild(pagination);

    if (initialEvaluationId) {
      const rec = records.find((r) => String(r.evaluationId) === String(initialEvaluationId));
      if (rec) {
        const toOpen = rec;
        initialEvaluationId = "";
        await openDetailsModal(toOpen);
      }
    }
  }
>>>>>>> Stashed changes

  function createPaginationControls(
    current,
    totalPages,
    totalItems,
    startDisplay,
    endDisplay
  ) {
    const container = createElement("div", "admin-pagination");

    const summary = createElement(
      "div",
      "pagination-summary",
<<<<<<< Updated upstream
      `Showing ${startDisplay}–${endDisplay} of ${totalItems}`
=======
      `Showing ${startDisplay}-${endDisplay} of ${totalItems}`
>>>>>>> Stashed changes
    );

    const controls = createElement("div", "pagination-controls");

    const prevBtn = createElement("button", "pagination-btn", "Previous");
    prevBtn.type = "button";
    prevBtn.disabled = current === 1;
<<<<<<< Updated upstream
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderTable();
      }
    });
=======
    prevBtn.addEventListener("click", async () => {
      if (currentPage > 1) {
        currentPage -= 1;
        await renderTable();
      }
    });
>>>>>>> Stashed changes

    const pageInfo = createElement(
      "span",
      "pagination-page-info",
      `Page ${current} of ${totalPages}`
    );

    const nextBtn = createElement("button", "pagination-btn", "Next");
    nextBtn.type = "button";
    nextBtn.disabled = current === totalPages;
<<<<<<< Updated upstream
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderTable();
      }
    });
=======
    nextBtn.addEventListener("click", async () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        await renderTable();
      }
    });
>>>>>>> Stashed changes

    controls.appendChild(prevBtn);
    controls.appendChild(pageInfo);
    controls.appendChild(nextBtn);

    container.appendChild(summary);
    container.appendChild(controls);

    return container;
  }

<<<<<<< Updated upstream
  function openDetailsModal(record) {
    if (!modalRoot) return;
=======
  async function openDetailsModal(record) {
    if (!modalRoot) return;
>>>>>>> Stashed changes

    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal admin-report-modal");

    function closeModal() {
      modalRoot.innerHTML = "";
    }

    const header = createElement("div", "modal-header");
    const title = createElement(
      "h3",
      null,
      `${record.course} – Section ${record.section}`
    );
    const closeBtn = createElement("button", "modal-close", "×");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", closeModal);

    const subtitle = createElement(
      "p",
      "modal-subtitle",
      record.term ? `Term: ${record.term}` : ""
    );

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = createElement("div", "modal-body");
    body.appendChild(subtitle);

<<<<<<< Updated upstream
    const avgCard = createElement("div", "side-panel-card");
    const avgTitle = createElement("h4", null, "Average scores");

    const scoreMetrics = [
      { label: "Overall", value: record.avgOverall },
      { label: "Instructor", value: record.avgInstructor },
      { label: "Course", value: record.avgCourse }
    ].filter((m) => m.value !== undefined && m.value !== null);

    let avgBody;
    if (scoreMetrics.length === 0) {
      avgBody = createElement(
        "p",
        "side-panel-text",
        "Average scores are not available in the mock data."
      );
    } else {
      avgBody = createElement("ul", "avg-scores-list");
      scoreMetrics.forEach((m) => {
        const li = createElement(
          "li",
          null,
          `${m.label}: ${Number(m.value).toFixed(2)}`
        );
        avgBody.appendChild(li);
      });
    }
=======
    const avgCard = createElement("div", "side-panel-card");
    const avgTitle = createElement("h4", null, "Average scores");

    let results = null;
    try {
      if (record.evaluationId) {
        results = await evaluationService.getResults(record.evaluationId);
      }
    } catch {
      results = null;
    }

    let avgBody;
    if (results?.statistics && Object.keys(results.statistics).length > 0) {
      avgBody = createElement("ul", "avg-scores-list");
      Object.values(results.statistics).forEach((s) => {
        const li = createElement(
          "li",
          null,
          `${s.questionText}: ${Number(s.average).toFixed(2)}`
        );
        avgBody.appendChild(li);
      });
    } else {
      avgBody = createElement(
        "p",
        "side-panel-text",
        "No rating statistics available yet."
      );
    }
>>>>>>> Stashed changes

    avgCard.appendChild(avgTitle);
    avgCard.appendChild(avgBody);

    const responsesCard = createElement("div", "side-panel-card");
<<<<<<< Updated upstream
    const responsesTitle = createElement("h4", null, "Response count");
    const countValue =
      record.submissions !== undefined && record.submissions !== null
        ? record.submissions
        : record.responseCount;
=======
    const responsesTitle = createElement("h4", null, "Response count");
    const countValue =
      results?.totalResponses ?? (record.submissions !== undefined && record.submissions !== null
        ? record.submissions
        : record.responseCount);
>>>>>>> Stashed changes
    const responsesBody = createElement(
      "p",
      "side-panel-text",
      countValue !== undefined
        ? `${countValue} responses submitted`
        : "Response count not available."
    );
    responsesCard.appendChild(responsesTitle);
    responsesCard.appendChild(responsesBody);

    const commentsCard = createElement("div", "side-panel-card");
<<<<<<< Updated upstream
    const commentsTitle = createElement("h4", null, "Top comments");

    const commentsArray =
      record.topComments ||
      record.comments ||
      [];
=======
    const commentsTitle = createElement("h4", null, "Top comments");

    const textComments = [];
    if (results?.responses && Array.isArray(results.responses)) {
      results.responses.forEach((r) => {
        (r.answers || []).forEach((a) => {
          if (a.questionType === "text" && a.answerValue && String(a.answerValue).trim() !== "") {
            textComments.push(String(a.answerValue).trim());
          }
        });
      });
    }

    const commentsArray = textComments;
>>>>>>> Stashed changes

    let commentsBody;
    if (!commentsArray || commentsArray.length === 0) {
      commentsBody = createElement(
        "p",
        "side-panel-text",
        "No comments available."
      );
    } else {
      commentsBody = createElement("ul", "top-comments-list");
      commentsArray.slice(0, 3).forEach((c) => {
        const li = createElement("li", "top-comment-item", c);
        commentsBody.appendChild(li);
      });
    }

    commentsCard.appendChild(commentsTitle);
    commentsCard.appendChild(commentsBody);

    body.appendChild(avgCard);
    body.appendChild(responsesCard);
    body.appendChild(commentsCard);

    const footer = createElement("div", "modal-footer");
    const closeFooterBtn = createElement("button", "btn-secondary", "Close");
    closeFooterBtn.type = "button";
    closeFooterBtn.addEventListener("click", closeModal);
    footer.appendChild(closeFooterBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);

    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });
  }

<<<<<<< Updated upstream
  function showSkeletonThenUpdate() {
    skeleton.style.display = "block";
    tableRegion.innerHTML = "";
    emptyState.style.display = "none";

    setTimeout(() => {
      skeleton.style.display = "none";
      updateFilterChips();
      renderTable();
    }, 600);
  }
=======
  function showSkeletonThenUpdate() {
    skeleton.style.display = "block";
    tableRegion.innerHTML = "";
    emptyState.style.display = "none";

    setTimeout(async () => {
      skeleton.style.display = "none";
      updateFilterChips();
      await renderTable();
    }, 600);
  }
>>>>>>> Stashed changes

  updateFilterChips();
  showSkeletonThenUpdate();
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes

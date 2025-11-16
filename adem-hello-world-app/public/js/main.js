import { $, createElement } from "./components/domUtils.js";
import { createButton } from "./components/button.js";
import { createInput } from "./components/input.js";
import { createSelect } from "./components/select.js";
import { createRadioGroup } from "./components/radioGroup.js";
import { createCard } from "./components/card.js";
import { createTable } from "./components/table.js";
import { showModal } from "./components/modal.js";
import { showToast } from "./components/toast.js";

/* ===========================
   Mock Data
   =========================== */

const mockEnrollments = [
  {
    courseId: "CS101",
    course: "Introduction to Computer Science",
    instructor: "Dr. Smith",
    term: "Fall 2026",
    status: "Not Started"
  },
  {
    courseId: "CS202",
    course: "Data Structures",
    instructor: "Prof. Lee",
    term: "Fall 2025",
    status: "In Progress"
  },
  {
    courseId: "CS303",
    course: "Software Engineering",
    instructor: "Dr. Johnson",
    term: "Spring 2025",
    status: "Completed"
  }
];

function getCurrentPath() {
  return window.location.pathname || "/";
}

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

function updateActiveNav(path) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (path.startsWith(linkPath)) {
      link.classList.add("nav-link-active");
    } else {
      link.classList.remove("nav-link-active");
    }
  });
}

function navigate(path) {
  window.history.pushState({}, "", path);
  renderRoute();
}

function renderDashboard() {
  const content = $("#app-content");
  content.innerHTML = "";

  const hasEnrollments = mockEnrollments && mockEnrollments.length > 0;

  if (!hasEnrollments) {
    const empty = createElement(
      "p",
      "empty-state",
      "You are not enrolled in any courses yet. Please check back later."
    );
    const card = createCard("My Enrolled Courses", empty);
    content.appendChild(card);
    return;
  }

  const columns = [
    { key: "course", label: "Course" },
    { key: "instructor", label: "Instructor" },
    { key: "term", label: "Term" },
    { key: "status", label: "Status" },
    {
      key: "action",
      label: "Start/Continue",
      render: (row) =>
        createButton("Start / Continue", "primary", () => {
          showToast(`Opening evaluation for ${row.course}`, "info", 1500);
          navigate(`/evaluate?courseId=${encodeURIComponent(row.courseId)}`);
        })
    }
  ];

  const tableElem = createTable(columns, mockEnrollments);
  const card = createCard("My Enrolled Courses", tableElem);
  content.appendChild(card);
}

function renderEvaluate() {
  const content = $("#app-content");
  content.innerHTML = "";

  const params = getSearchParams();
  const courseId = params.get("courseId");

  const form = createElement("form", "form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showModal("Thank you!", "Your evaluation has been recorded (demo).");
  });

  const likertOptions = [
    { value: "1", label: "Strongly Disagree" },
    { value: "2", label: "Disagree" },
    { value: "3", label: "Neutral" },
    { value: "4", label: "Agree" },
    { value: "5", label: "Strongly Agree" }
  ];

  let selectedRating = "";
  const radioGroup = createRadioGroup({
    label: "The course content was well organized.",
    name: "q1",
    options: likertOptions,
    value: selectedRating,
    onChange: (value) => {
      selectedRating = value;
    }
  });

  let commentsValue = "";
  const commentsInput = createInput({
    label: "Additional comments",
    id: "comments",
    type: "text",
    placeholder: "Write your feedback here...",
    onInput: (val) => {
      commentsValue = val;
    }
  });

  const actions = createElement("div", "form-actions");
  const submitBtn = createButton("Submit Evaluation", "primary", null, {
    type: "submit"
  });
  actions.appendChild(submitBtn);

  form.appendChild(radioGroup);
  form.appendChild(commentsInput);
  form.appendChild(actions);

  const title = courseId
    ? "Evaluation Form - Course: " + courseId
    : "Evaluation Form";

  const card = createCard(title, form);
  content.appendChild(card);
}

function renderAdminReports() {
  const content = $("#app-content");
  content.innerHTML = "";

  const body = createElement(
    "p",
    null,
    "This is a placeholder for Admin Reports. In Sprint 1, we focus on navigation and layout only."
  );

  const card = createCard("Admin Reports", body);
  content.appendChild(card);
}

function renderRoute() {
  const path = getCurrentPath();
  updateActiveNav(path);

  if (path === "/" || path === "") {
    navigate("/dashboard");
    return;
  }

  if (path.startsWith("/dashboard")) {
    renderDashboard();
  } else if (path.startsWith("/evaluate")) {
    renderEvaluate();
  } else if (path.startsWith("/admin/reports")) {
    renderAdminReports();
  } else {
    navigate("/dashboard");
  }
}

function initNavigationLinks() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("a[data-link]");
    if (!target) return;

    const href = target.getAttribute("href");
    if (href && href.startsWith("/")) {
      event.preventDefault();
      navigate(href);
    }
  });

  window.addEventListener("popstate", () => {
    renderRoute();
  });
}

function initApp() {
  initNavigationLinks();
  renderRoute();
}

document.addEventListener("DOMContentLoaded", initApp);

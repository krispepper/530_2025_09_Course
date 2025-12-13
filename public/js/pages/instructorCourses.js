import { $, createElement } from "../components/domUtils.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { instructorCourseService } from "../services/instructorCourseService.js";
import { authService } from "../services/authService.js";
import { renderEvaluate } from "./evaluationForm.js";

export async function renderInstructorCourses(navigate) {
  const go = typeof navigate === "function" ? navigate : () => {};

  const user = await authService.getCurrentUser();

  if (!user || user.role !== "instructor") {
    go("/dashboard");
    return;
  }

  const content = $("#app-content");
  content.innerHTML = "";

  const wrapper = createElement("div", "instructor-course-wrapper");

  const title = createElement("h2", null, "My Courses");

  const createBtn = createElement("button", "btn-primary", "Create Course");
  createBtn.onclick = () => openCourseModal();

  wrapper.append(title, createBtn);

  const tableRegion = createElement("div", "instructor-table-region");
  wrapper.appendChild(tableRegion);

  const card = createCard("Instructor Course Management", wrapper);
  content.appendChild(card);

  await loadCourses();

  async function loadCourses() {
    tableRegion.innerHTML = "";

    let res;
    try {
      res = await instructorCourseService.getMyCourses();
    } catch (err) {
      console.error("Failed to load instructor courses:", err);
      tableRegion.appendChild(
        createElement(
          "p",
          "empty-state",
          err?.data?.message || err?.message || "Failed to load courses"
        )
      );
      return;
    }

    const courses = res?.courses || [];

    if (courses.length === 0) {
      tableRegion.appendChild(
        createElement(
          "p",
          "empty-state",
          "No courses found. Click “Create Course” to add one."
        )
      );
      return;
    }

    const columns = [
      { key: "courseName", label: "Course Name" },
      { key: "courseCode", label: "Course Code" },
      { key: "term", label: "Term" },
      { key: "section", label: "Section" },
      { key: "isActive", label: "Status" },
      { key: "actions", label: "Actions" }
    ];

    const tableData = courses.map((course) => ({
      ...course,
      term: (course.term || "").trim() || "N/A",
      section: (course.section || "").trim() || "N/A",
      isActive: course.isActive ? "Active" : "Inactive",
      actions: "Actions"
    }));

    const table = createTable(columns, tableData);
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row, i) => {
      const course = courses[i];
      row.lastChild.innerHTML = "";

      const editBtn = createElement("button", "btn-sm", "Update");
      editBtn.onclick = () => openCourseModal(course);

      const deleteBtn = createElement("button", "btn-sm-danger", "Delete");
      deleteBtn.onclick = () => {
        showConfirmModal(`Are you sure you want to delete "${course.courseName}"?`, async () => {
          await instructorCourseService.deleteCourse(course._id);
          await loadCourses();
        });
      };

      const viewStudentsBtn = createElement("button", "btn-sm", "View Students");
      viewStudentsBtn.onclick = () => openStudentsModal(course);

      row.lastChild.append(editBtn, deleteBtn, viewStudentsBtn);
    });

    tableRegion.appendChild(table);
  }

  async function openStudentsModal(course) {
    const modalRoot = $("#modal-root");
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal");
    modal.classList.add("admin-report-modal");

    const header = createElement("div", "modal-header");
    const heading = createElement("h3", null, `Enrolled Students - ${course.courseName}`);

    const xBtn = createElement("button", "modal-close", "×");
    xBtn.type = "button";
    xBtn.onclick = () => {
      modalRoot.innerHTML = "";
    };

    header.appendChild(heading);
    header.appendChild(xBtn);

    const body = createElement("div", "modal-body");
    body.textContent = "Loading...";

    const footer = createElement("div", "modal-footer");
    const closeBtn = createElement("button", "btn-secondary", "Close");
    closeBtn.type = "button";
    closeBtn.onclick = () => {
      modalRoot.innerHTML = "";
    };
    footer.appendChild(closeBtn);

    modal.append(header, body, footer);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) modalRoot.innerHTML = "";
    });

    let res;
    try {
      res = await instructorCourseService.getCourseStudents(course._id);
    } catch (err) {
      console.error("Failed to load students:", err);
      body.innerHTML = "";
      body.appendChild(
        createElement(
          "p",
          "empty-state",
          err?.data?.message || err?.message || "Failed to load students"
        )
      );
      return;
    }

    const students = res?.students || [];
    const evaluationId = res?.evaluationId || null;

    body.innerHTML = "";

    if (students.length === 0) {
      body.appendChild(createElement("p", "empty-state", "No students enrolled in this course."));
      return;
    }

    const columns = [
      { key: "email", label: "Student Email" },
      { key: "status", label: "Evaluation Status" },
      { key: "actions", label: "Actions" }
    ];

    const tableData = students.map((s) => ({
      email: s.email || "N/A",
      status: s.hasSubmitted ? "Submitted" : "Not submitted",
      actions: "Actions"
    }));

    const table = createTable(columns, tableData);
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row, idx) => {
      const s = students[idx];
      const actionsCell = row.lastChild;
      actionsCell.innerHTML = "";

      const viewBtn = createElement("button", "btn-sm", "View");

      const canView = !!(evaluationId && s.hasSubmitted && s.responseId);

      if (!canView) {
        viewBtn.disabled = true;
        viewBtn.title = !evaluationId
          ? "No evaluation exists for this course yet."
          : "Student has not submitted the evaluation yet.";
      } else {
        viewBtn.onclick = async () => {
          await openSubmissionModal(course, s, evaluationId);
        };
      }

      actionsCell.appendChild(viewBtn);
    });

    body.appendChild(table);
  }

  async function openSubmissionModal(course, student, evaluationId) {
    const modalRoot = $("#modal-root");
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal");
    modal.classList.add("admin-report-modal", "modal-large-eval");

    const header = createElement("div", "modal-header");
    const heading = createElement("h3", null, "View Submitted Evaluation");

    const xBtn = createElement("button", "modal-close", "×");
    xBtn.type = "button";
    xBtn.onclick = () => {
      modalRoot.innerHTML = "";
    };

    header.appendChild(heading);
    header.appendChild(xBtn);

    const body = createElement("div", "modal-body");
    const evalMount = createElement("div", null, "");
    body.appendChild(evalMount);

    const footer = createElement("div", "modal-footer");
    const backBtn = createElement("button", "btn-secondary", "Back to Reports");
    backBtn.type = "button";
    backBtn.onclick = () => {
      modalRoot.innerHTML = "";
    };
    footer.appendChild(backBtn);

    modal.append(header, body, footer);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) modalRoot.innerHTML = "";
    });

    await renderEvaluate(() => {}, {
      mountNode: evalMount,
      evaluationId: evaluationId,
      mode: "adminView",
      responseId: student.responseId
    });
  }

  function openCourseModal(course = null) {
    const modalRoot = $("#modal-root");
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal");

    const heading = createElement("h3", null, course ? "Update Course" : "Create Course");

    const name = createElement("input");
    name.placeholder = "Course Name";
    name.value = course?.courseName || "";

    const code = createElement("input");
    code.placeholder = "Course Code (e.g., CS530)";
    code.value = course?.courseCode || "";

    const term = createElement("input");
    term.placeholder = "Term (e.g., Fall 2025)";
    term.value = course?.term || "";

    const section = createElement("input");
    section.placeholder = "Section (e.g., 001)";
    section.value = course?.section || "";

    const desc = createElement("textarea");
    desc.placeholder = "Description";
    desc.value = course?.description || "";

    const submitBtn = createElement("button", "btn-primary", course ? "Update" : "Create");
    const cancelBtn = createElement("button", "btn-secondary", "Cancel");

    cancelBtn.onclick = () => {
      modalRoot.innerHTML = "";
    };

    submitBtn.onclick = async () => {
      const payload = {
        courseName: name.value.trim(),
        courseCode: code.value.trim(),
        term: term.value.trim(),
        section: section.value.trim(),
        description: desc.value.trim()
      };

      if (!payload.courseName || !payload.courseCode || !payload.term || !payload.section) {
        alert("Course name, code, term, and section are required");
        return;
      }

      showConfirmModal(
        course ? "Are you sure you want to update this course?" : "Are you sure you want to create this course?",
        async () => {
          if (course) {
            await instructorCourseService.updateCourse(course._id, {
              ...payload,
              isActive: course.isActive
            });
          } else {
            await instructorCourseService.createCourse(payload);
          }

          modalRoot.innerHTML = "";
          await loadCourses();
        }
      );
    };

    modal.append(heading, name, code, term, section, desc, submitBtn, cancelBtn);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) modalRoot.innerHTML = "";
    });
  }
}

function showConfirmModal(message, onConfirm) {
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = "";

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "modal";

  const title = document.createElement("h3");
  title.textContent = "Please Confirm";

  const text = document.createElement("p");
  text.textContent = message;

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";
  actions.style.gap = "10px";
  actions.style.marginTop = "20px";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn-secondary";
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => {
    modalRoot.innerHTML = "";
  };

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn-primary";
  confirmBtn.textContent = "Confirm";
  confirmBtn.onclick = () => {
    modalRoot.innerHTML = "";
    onConfirm();
  };

  actions.append(cancelBtn, confirmBtn);
  modal.append(title, text, actions);
  backdrop.appendChild(modal);
  modalRoot.appendChild(backdrop);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) modalRoot.innerHTML = "";
  });
}
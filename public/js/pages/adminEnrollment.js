import { $, createElement } from "../components/domUtils.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { adminEnrollmentService } from "../services/adminEnrollmentService.js";
import { authService } from "../services/authService.js";

export async function renderAdminEnrollment() {
  const user = await authService.getCurrentUser();

  if (!user || user.role !== "admin") {
    window.history.replaceState({}, "", "/dashboard");
    return;
  }

  const content = $("#app-content");
  content.innerHTML = "";

  const wrapper = createElement("div", "admin-enrollment-wrapper");

  const title = createElement("h2", null, "Enroll / Remove Students");
  const subtitle = createElement("p", "empty-state", "Admin Only");

  wrapper.append(title, subtitle);

  const tableRegion = createElement("div", "admin-table-region");
  wrapper.appendChild(tableRegion);

  const card = createCard("Admin Student Enrollment", wrapper);
  content.appendChild(card);

  loadCourses();

  async function loadCourses() {
    const res = await adminEnrollmentService.getAllCourses();
    if (!res.courses) return;

    tableRegion.innerHTML = "";

    const columns = [
      { key: "courseName", label: "Course Name" },
      { key: "courseCode", label: "Course Code" },
      { key: "students", label: "Total Students" },
      { key: "actions", label: "Actions" }
    ];

    const tableData = res.courses.map(course => ({
      courseName: course.courseName,
      courseCode: course.courseCode,
      students: course.students.length,
      actions: "Manage"
    }));

    const table = createTable(columns, tableData);
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row, index) => {
      const course = res.courses[index];
      row.lastChild.innerHTML = "";

      const enrollBtn = createElement("button", "btn-sm", "Enroll");
      enrollBtn.onclick = () => openEnrollModal(course);

      const removeBtn = createElement("button", "btn-sm-danger", "Remove");
      removeBtn.onclick = () => openRemoveModal(course);

      row.lastChild.append(enrollBtn, removeBtn);
    });

    tableRegion.appendChild(table);
  }

  function openEnrollModal(course) {
    const modalRoot = $("#modal-root");
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal");

    const title = createElement(
      "h3",
      null,
      `Enroll Student → ${course.courseName}`
    );

    const input = createElement("input");
    input.placeholder = "Student Email";

    const errorMsg = createElement("p", "error-message");

    const submit = createElement("button", "btn-primary", "Enroll");
    const cancel = createElement("button", "btn-secondary", "Cancel");

    submit.onclick = async () => {
      errorMsg.textContent = "";

      if (!input.value.trim()) {
        errorMsg.textContent = "Student email is required";
        return;
      }

      try {
        await adminEnrollmentService.enrollStudent(
          course._id,
          input.value.trim()
        );

        modalRoot.innerHTML = "";
        loadCourses();

      } catch (err) {
        errorMsg.textContent =
          err.message || "Student email not found or already enrolled";
      }
    };

    cancel.onclick = () => (modalRoot.innerHTML = "");

    modal.append(title, input, errorMsg, submit, cancel);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);
  }

  function openRemoveModal(course) {
    const modalRoot = $("#modal-root");
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal");

    const title = createElement(
      "h3",
      null,
      `Remove Student → ${course.courseName}`
    );

    const input = createElement("input");
    input.placeholder = "Student Email";

    const errorMsg = createElement("p", "error-message");

    const submit = createElement("button", "btn-primary", "Remove");
    const cancel = createElement("button", "btn-secondary", "Cancel");

    submit.onclick = async () => {
      errorMsg.textContent = "";

      if (!input.value.trim()) {
        errorMsg.textContent = "Student email is required";
        return;
      }

      try {
        await adminEnrollmentService.removeStudent(
          course._id,
          input.value.trim()
        );

        modalRoot.innerHTML = "";
        loadCourses();

      } catch (err) {
        errorMsg.textContent =
          err.message || "Student email not found or not enrolled";
      }
    };

    cancel.onclick = () => (modalRoot.innerHTML = "");

    modal.append(title, input, errorMsg, submit, cancel);
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);
  }
}

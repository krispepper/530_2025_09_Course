import { $, createElement } from "../components/domUtils.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
<<<<<<< Updated upstream
import { instructorCourseService } from "../services/instructorCourseService.js";
import { authService } from "../services/authService.js";

export async function renderInstructorCourses() {
  const user = await authService.getCurrentUser();

  if (!user || user.role !== "instructor") {
    navigate("/dashboard");
    return;
  }
=======
import { instructorCourseService } from "../services/instructorCourseService.js";
import { authService } from "../services/authService.js";

export async function renderInstructorCourses(navigate) {
  const go = typeof navigate === "function" ? navigate : (p) => (window.history.pushState({}, "", p), window.dispatchEvent(new PopStateEvent("popstate")));
  const user = await authService.getCurrentUser();

  if (!user || user.role !== "instructor") {
    go("/dashboard");
    return;
  }
>>>>>>> Stashed changes

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

  loadCourses();

  async function loadCourses() {
    const res = await instructorCourseService.getMyCourses();
    if (!res.courses) return;

    tableRegion.innerHTML = "";

    const columns = [
      { key: "courseName", label: "Course Name" },
      { key: "courseCode", label: "Course Code" },
      { key: "isActive", label: "Status" },
      { key: "actions", label: "Actions" }
    ];

    const tableData = res.courses.map(course => ({
      ...course,
      isActive: course.isActive ? "Active" : "Inactive",
      actions: "Actions"
    }));

    const table = createTable(columns, tableData);
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row, i) => {
      const course = res.courses[i];
      row.lastChild.innerHTML = "";

      const editBtn = createElement("button", "btn-sm", "Update");
      editBtn.onclick = () => openCourseModal(course);

<<<<<<< Updated upstream
      const deleteBtn = createElement("button", "btn-sm-danger", "Delete");
=======
      const deleteBtn = createElement("button", "btn-sm-danger", "Delete");
>>>>>>> Stashed changes
      deleteBtn.onclick = () => {
        showConfirmModal(
          `Are you sure you want to delete "${course.courseName}"?`,
          async () => {
            await instructorCourseService.deleteCourse(course._id);
            loadCourses();
          }
        );
      };

<<<<<<< Updated upstream
      row.lastChild.append(editBtn, deleteBtn);
=======
      row.lastChild.append(editBtn, deleteBtn);
>>>>>>> Stashed changes
    });

    tableRegion.appendChild(table);
  }

  function openCourseModal(course = null) {
    const modalRoot = $("#modal-root");
    modalRoot.innerHTML = "";

    const backdrop = createElement("div", "modal-backdrop");
    const modal = createElement("div", "modal");

    const heading = createElement(
      "h3",
      null,
      course ? "Update Course" : "Create Course"
    );

    const name = createElement("input");
    name.placeholder = "Course Name";
    name.value = course?.courseName || "";

    const code = createElement("input");
    code.placeholder = "Course Code";
    code.value = course?.courseCode || "";

    const desc = createElement("textarea");
    desc.placeholder = "Description";
    desc.value = course?.description || "";

    const submitBtn = createElement(
      "button",
      "btn-primary",
      course ? "Update" : "Create"
    );

    const cancelBtn = createElement("button", "btn-secondary", "Cancel");

    cancelBtn.onclick = () => {
      modalRoot.innerHTML = "";
    };

    submitBtn.onclick = async () => {
      if (!name.value || !code.value) {
        alert("Course name and code are required");
        return;
      }

      showConfirmModal(
        course
          ? "Are you sure you want to update this course?"
          : "Are you sure you want to create this course?",
        async () => {
          if (course) {
            await instructorCourseService.updateCourse(course._id, {
              courseName: name.value,
              courseCode: code.value,
              description: desc.value,
              isActive: course.isActive
            });
          } else {
            await instructorCourseService.createCourse({
              courseName: name.value,
              courseCode: code.value,
              description: desc.value
            });
          }

          modalRoot.innerHTML = "";
          loadCourses();
        }
      );
    };

    modal.append(
      heading,
      name,
      code,
      desc,
      submitBtn,
      cancelBtn
    );

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

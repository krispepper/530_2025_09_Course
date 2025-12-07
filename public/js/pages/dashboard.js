import { $, createElement } from "../components/domUtils.js";
import { createButton } from "../components/button.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { showToast } from "../components/toast.js";
import { authService } from "../services/authService.js";
import { studentCourseService } from "../services/studentCourseService.js";

export async function renderDashboard(navigate) {
  const user = await authService.getCurrentUser();

  if (!user || user.role !== "student") {
    navigate("/login");
    return;
  }

  const content = $("#app-content");
  content.innerHTML = "";

  let res;
  try {
    res = await studentCourseService.getMyEnrollments();
  } catch (err) {
    content.appendChild(
      createCard("My Enrolled Courses", 
        createElement("p", "empty-state", "Failed to load enrollments")
      )
    );
    return;
  }

  const courses = res.courses || [];

  if (courses.length === 0) {
    const empty = createElement(
      "p",
      "empty-state",
      "You are not enrolled in any courses yet."
    );
    const card = createCard("My Enrolled Courses", empty);
    content.appendChild(card);
    return;
  }

  const tableData = courses.map(course => ({
    courseId: course._id,
    course: course.courseName,
    instructor: course.instructor?.email || "N/A",
    term: "Fall 2025",
    status: course.isActive ? "Active" : "Inactive"
  }));

  const columns = [
    { key: "course", label: "Course" },
    { key: "instructor", label: "Instructor" },
    { key: "term", label: "Term" },
    { key: "status", label: "Status" },
    {
      key: "action",
      label: "Start / Continue",
      render: (row) =>
        createButton("Start / Continue", "primary", () => {
          showToast(`Opening evaluation for ${row.course}`, "info", 1500);
          navigate(`/evaluate?courseId=${encodeURIComponent(row.courseId)}`);
        })
    }
  ];

  const tableElem = createTable(columns, tableData);
  const card = createCard("My Enrolled Courses", tableElem);
  content.appendChild(card);
}

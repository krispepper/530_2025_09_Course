import { $, createElement } from "../components/domUtils.js";
import { createButton } from "../components/button.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { showToast } from "../components/toast.js";
import { authService } from "../services/authService.js";
import { studentCourseService } from "../services/studentCourseService.js";
import { evaluationService } from "../services/evaluationService.js";

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
      createCard("My Enrolled Courses", createElement("p", "empty-state", "Failed to load enrollments"))
    );
    return;
  }

  const courses = res.courses || [];

  if (courses.length === 0) {
    content.appendChild(
      createCard(
        "My Enrolled Courses",
        createElement("p", "empty-state", "You are not enrolled in any courses yet.")
      )
    );
    return;
  }

  const rows = await Promise.all(
    courses.map(async (course) => {
      let ensureRes = null;

      try {
        ensureRes = await evaluationService.ensureEvaluation(course._id);
      } catch (e) {
        ensureRes = null;
      }

      return {
        courseId: course._id,
        course: course.courseName,
        instructor: course.instructor?.email || "N/A",
        term: (course.term || "").trim() || "N/A",
        section: (course.section || "").trim() || "N/A",
        status: course.isActive ? "Active" : "Inactive",

        evaluationId: ensureRes?.evaluationId || null,
        hasSubmitted: !!ensureRes?.hasSubmitted
      };
    })
  );

  const columns = [
    { key: "course", label: "Course" },
    { key: "instructor", label: "Instructor" },
    { key: "term", label: "Term" },
    { key: "section", label: "Section" },
    { key: "status", label: "Status" },
    {
      key: "action",
      label: "Action",
      render: (row) => {
        if (!row.evaluationId) {
          const btn = createButton("Unavailable", "secondary", () => {
            showToast("Evaluation not available right now.", "error", 1500);
          });
          btn.disabled = true;
          return btn;
        }

        if (row.hasSubmitted) {
          return createButton("View", "secondary", () => {
            showToast(`Opening submitted evaluation for ${row.course}`, "info", 1200);
            navigate(`/evaluate?evaluationId=${encodeURIComponent(row.evaluationId)}&mode=view`);
          });
        }

        return createButton("Start / Continue", "primary", () => {
          showToast(`Opening evaluation for ${row.course}`, "info", 1200);
          navigate(`/evaluate?evaluationId=${encodeURIComponent(row.evaluationId)}`);
        });
      }
    }
  ];

  const tableElem = createTable(columns, rows);
  content.appendChild(createCard("My Enrolled Courses", tableElem));
}

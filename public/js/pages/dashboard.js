import { $ , createElement } from "../components/domUtils.js";
import { createButton } from "../components/button.js";
import { createCard } from "../components/card.js";
import { createTable } from "../components/table.js";
import { showToast } from "../components/toast.js";
import { mockEnrollments } from "../data/mockEnrollments.js";
import { authService } from "../services/authService.js";

export async function renderDashboard(navigate) {
  const user = await authService.getCurrentUser();

  if (!user) {
    navigate("/login");
    return;
  }
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

import { $, createElement } from "../components/domUtils.js";
import { createInput } from "../components/input.js";
import { createRadioGroup } from "../components/radioGroup.js";
import { createCard } from "../components/card.js";
import { showModal } from "../components/modal.js";
import { mockEnrollments } from "../data/mockEnrollments.js";

export function renderEvaluate() {
  const content = $("#app-content");
  content.innerHTML = "";

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId");

  const enrollment =
    mockEnrollments.find((c) => c.courseId === courseId) || null;

  const form = createElement("form", "form");

  const errorSummary = createElement("div", "error-summary");
  errorSummary.style.display = "none";
  form.appendChild(errorSummary);

  const headerWrapper = createElement("div", "evaluation-header");

  const headerMain = createElement(
    "div",
    "evaluation-header-main",
    enrollment ? enrollment.course : "Selected Course (Demo)"
  );

  const headerSubText = enrollment
    ? `Instructor: ${enrollment.instructor}  •  Term: ${enrollment.term}`
    : "Instructor: Demo Instructor  •  Term: Demo Term";

  const headerSub = createElement("div", "evaluation-header-sub", headerSubText);

  headerWrapper.appendChild(headerMain);
  headerWrapper.appendChild(headerSub);

  const headerNote = createElement(
    "p",
    "evaluation-header-note",
    "Please respond to all required items marked with an asterisk (*)."
  );
  headerWrapper.appendChild(headerNote);

  form.appendChild(headerWrapper);

  const likertOptions = [
    { value: "1", label: "1 - Strongly Disagree" },
    { value: "2", label: "2 - Disagree" },
    { value: "3", label: "3 - Neutral" },
    { value: "4", label: "4 - Agree" },
    { value: "5", label: "5 - Strongly Agree" }
  ];

  const questions = [
    {
      name: "q1",
      label: "The course content was well organized. *"
    },
    {
      name: "q2",
      label: "The instructor clearly explained course concepts. *"
    },
    {
      name: "q3",
      label:
        "Feedback on assignments and assessments helped me improve my learning. *"
    },
    {
      name: "q4",
      label: "Overall, I would recommend this course to other students. *"
    }
  ];

  const answers = {};

  questions.forEach((q) => {
    const group = createRadioGroup({
      label: q.label,
      name: q.name,
      options: likertOptions,
      value: "",
      onChange: (value) => {
        answers[q.name] = value;
      }
    });

    form.appendChild(group);
  });

  let commentsValue = "";
  const commentsInput = createInput({
    label: "Additional comments on the course and instruction *",
    id: "comments",
    type: "text",
    placeholder: "Please provide any additional feedback or suggestions...",
    onInput: (val) => {
      commentsValue = val;
    }
  });

  form.appendChild(commentsInput);

  const actions = createElement("div", "form-actions");
  const submitBtn = createElement("button", "btn btn-primary");
  submitBtn.type = "submit";
  submitBtn.textContent = "Submit Evaluation";
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const errors = [];

    questions.forEach((q) => {
      if (!answers[q.name]) {
        const labelText = q.label.replace(/\s*\*$/, "");
        errors.push(`Please respond to: "${labelText}".`);
      }
    });

    if (!commentsValue || !commentsValue.trim()) {
      errors.push("Please provide your additional comments or suggestions.");
    }

    if (errors.length > 0) {
      errorSummary.innerHTML = "";

      const heading = createElement(
        "p",
        "error-summary-heading",
        "Your evaluation could not be submitted. Please address the following:"
      );
      errorSummary.appendChild(heading);

      const ul = document.createElement("ul");
      errors.forEach((msg) => {
        const li = document.createElement("li");
        li.textContent = msg;
        ul.appendChild(li);
      });
      errorSummary.appendChild(ul);

      errorSummary.style.display = "block";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    errorSummary.innerHTML = "";
    errorSummary.style.display = "none";

    showModal(
      "Thank you for your feedback",
      "Your course evaluation has been recorded for this demonstration. Your input is valuable and helps improve future course offerings."
    );

    form.reset();
    questions.forEach((q) => {
      answers[q.name] = "";
    });
    commentsValue = "";
  });

  const wrapper = createElement("div");
  wrapper.appendChild(form);

  const title = enrollment
    ? "Course Evaluation Form"
    : "Course Evaluation Form (Demo Course)";

  const card = createCard(title, wrapper);
  content.appendChild(card);
}

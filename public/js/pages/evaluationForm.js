import { $, createElement } from "../components/domUtils.js";
import { createInput } from "../components/input.js";
import { createRadioGroup } from "../components/radioGroup.js";
import { createCard } from "../components/card.js";
import { showModal } from "../components/modal.js";
import { mockEnrollments } from "../data/mockEnrollments.js";
import { authService } from "../services/authService.js";

export async function renderEvaluate() {
  const user = await authService.getCurrentUser();

  if (!user) {
    navigate("/login");
    return;
  }
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

  const headerNote = createElement(
    "p",
    "evaluation-header-note",
    "Please respond to all required items marked with an asterisk (*)."
  );

  headerWrapper.appendChild(headerMain);
  headerWrapper.appendChild(headerSub);
  headerWrapper.appendChild(headerNote);

  const overallProgressWrapper = createElement("div", "overall-progress");
  const overallProgressLabel = createElement(
    "div",
    "overall-progress-label",
    "Overall: 0/0 answered"
  );
  const overallProgressBar = createElement("div", "overall-progress-bar");
  const overallProgressFill = createElement(
    "div",
    "overall-progress-bar-fill"
  );
  overallProgressBar.appendChild(overallProgressFill);
  overallProgressWrapper.appendChild(overallProgressLabel);
  overallProgressWrapper.appendChild(overallProgressBar);

  headerWrapper.appendChild(overallProgressWrapper);
  form.appendChild(headerWrapper);

  const likertOptions = [
    { value: "1", label: "1 - Strongly Disagree" },
    { value: "2", label: "2 - Disagree" },
    { value: "3", label: "3 - Neutral" },
    { value: "4", label: "4 - Agree" },
    { value: "5", label: "5 - Strongly Agree" }
  ];

  const sections = [
    {
      id: "course-structure",
      title: "Course Organization & Instruction",
      description:
        "These questions focus on how well the course content was structured and how clearly it was taught.",
      tooltip:
        "Think about pacing, clarity of explanations, and how the material was organized."
    },
    {
      id: "learning-support",
      title: "Feedback & Overall Experience",
      description:
        "These questions focus on feedback you received and your overall recommendation.",
      tooltip:
        "Consider how feedback helped you improve and whether you would recommend this course."
    },
    {
      id: "engagement",
      title: "Classroom Engagement & Participation",
      description:
        "These questions focus on how engaged you felt during class sessions and how participation was encouraged.",
      tooltip:
        "Think about discussions, activities, and how comfortable you felt contributing in class."
    },
    {
      id: "materials",
      title: "Course Materials & Resources",
      description:
        "These questions focus on the quality and usefulness of the course materials and resources provided.",
      tooltip:
        "Consider the clarity, accessibility, and helpfulness of slides, readings, and online materials."
    }
  ];

  const questions = [
    // Course Organization & Instruction
    {
      name: "q1",
      label: "The course content was well organized. *",
      sectionId: "course-structure"
    },
    {
      name: "q2",
      label: "The instructor clearly explained course concepts. *",
      sectionId: "course-structure"
    },
    // Feedback & Overall Experience
    {
      name: "q3",
      label:
        "Feedback on assignments and assessments helped me improve my learning. *",
      sectionId: "learning-support"
    },
    {
      name: "q4",
      label: "Overall, I would recommend this course to other students. *",
      sectionId: "learning-support"
    },
    // Classroom Engagement & Participation
    {
      name: "q5",
      label:
        "Class activities and discussions helped me stay engaged with the course material. *",
      sectionId: "engagement"
    },
    {
      name: "q6",
      label:
        "The instructor encouraged student participation and questions. *",
      sectionId: "engagement"
    },
    // Course Materials & Resources
    {
      name: "q7",
      label:
        "The course materials (e.g., slides, readings, videos) supported my learning effectively. *",
      sectionId: "materials"
    },
    {
      name: "q8",
      label:
        "Online resources and tools used in this course were easy to access and use. *",
      sectionId: "materials"
    }
  ];

  const answers = {};
  let commentsValue = ""; 
  const sectionBodies = {};
  const sectionProgressLabels = {};

  function updateSectionProgress(sectionId) {
    const label = sectionProgressLabels[sectionId];
    if (!label) return;

    const sectionQuestions = questions.filter(
      (q) => q.sectionId === sectionId
    );
    const total = sectionQuestions.length;
    const answeredCount = sectionQuestions.filter(
      (q) => !!answers[q.name]
    ).length;

    label.textContent = `${answeredCount}/${total} answered`;
  }

  function updateOverallProgress() {
    const totalRequired = questions.length + 1; 
    const answeredLikert = questions.filter(
      (q) => !!answers[q.name]
    ).length;
    const commentsAnswered =
      commentsValue && commentsValue.trim().length > 0 ? 1 : 0;

    const answeredTotal = answeredLikert + commentsAnswered;

    overallProgressLabel.textContent = `Overall: ${answeredTotal}/${totalRequired} answered`;

    const percentage =
      totalRequired === 0
        ? 0
        : Math.round((answeredTotal / totalRequired) * 100);

    overallProgressFill.style.width = percentage + "%";
  }

  function createSectionPanel(section) {
    const sectionPanel = createElement("div", "evaluation-section-panel");

    const header = createElement("div", "evaluation-section-header");

    const titleWrapper = createElement(
      "div",
      "evaluation-section-title-wrapper"
    );
    const title = createElement("h3", "evaluation-section-title", section.title);
    const desc = createElement(
      "p",
      "evaluation-section-description",
      section.description
    );
    titleWrapper.appendChild(title);
    titleWrapper.appendChild(desc);

    const metaWrapper = createElement("div", "evaluation-section-meta");

    const progressLabel = createElement(
      "span",
      "evaluation-section-progress",
      "0/0 answered"
    );

    const tooltipIcon = createElement("span", "evaluation-section-tooltip", "?");
    tooltipIcon.setAttribute("title", section.tooltip);

    metaWrapper.appendChild(progressLabel);
    metaWrapper.appendChild(tooltipIcon);

    header.appendChild(titleWrapper);
    header.appendChild(metaWrapper);

    const body = createElement("div", "evaluation-section-body");
    body.style.display = "block";

    const helperBox = createElement("div", "evaluation-section-helper");
    helperBox.style.display = "none";

    helperBox.innerHTML = `
      <strong>How to answer this section:</strong>
      <ul>
        <li>Use the 1–5 scale based on your overall experience in this course.</li>
        <li>Think about the entire term, not just one class session.</li>
        <li>If you are unsure, choose the option that feels closest.</li>
      </ul>
    `;
    body.appendChild(helperBox);

    tooltipIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = helperBox.style.display === "none";
      helperBox.style.display = isHidden ? "block" : "none";
    });

    header.addEventListener("click", () => {
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "block" : "none";
      sectionPanel.classList.toggle("collapsed", !isCollapsed);
    });

    sectionPanel.appendChild(header);
    sectionPanel.appendChild(body);

    form.appendChild(sectionPanel);

    sectionBodies[section.id] = body;
    sectionProgressLabels[section.id] = progressLabel;
  }

  sections.forEach(createSectionPanel);

  questions.forEach((q) => {
    const group = createRadioGroup({
      label: q.label,
      name: q.name,
      options: likertOptions,
      value: "",
      onChange: (value) => {
        answers[q.name] = value;
        updateSectionProgress(q.sectionId);
        updateOverallProgress();
      }
    });

    const body = sectionBodies[q.sectionId];
    if (body) {
      body.appendChild(group);
    } else {
      form.appendChild(group);
    }
  });
  sections.forEach((s) => updateSectionProgress(s.id));
  updateOverallProgress();

  const commentsSectionPanel = createElement(
    "div",
    "evaluation-section-panel"
  );
  const commentsHeader = createElement("div", "evaluation-section-header");

  const commentsTitleWrapper = createElement(
    "div",
    "evaluation-section-title-wrapper"
  );
  const commentsTitle = createElement(
    "h3",
    "evaluation-section-title",
    "Open Comments"
  );
  const commentsDesc = createElement(
    "p",
    "evaluation-section-description",
    "Use this space to share any additional feedback or suggestions about the course and instruction."
  );
  commentsTitleWrapper.appendChild(commentsTitle);
  commentsTitleWrapper.appendChild(commentsDesc);

  const commentsMeta = createElement("div", "evaluation-section-meta");
  const commentsProgressLabel = createElement(
    "span",
    "evaluation-section-progress",
    "0/1 answered"
  );
  const commentsTooltip = createElement(
    "span",
    "evaluation-section-tooltip",
    "?"
  );
  commentsTooltip.setAttribute(
    "title",
    "You can write anything that you think would help improve this course."
  );

  commentsMeta.appendChild(commentsProgressLabel);
  commentsMeta.appendChild(commentsTooltip);

  commentsHeader.appendChild(commentsTitleWrapper);
  commentsHeader.appendChild(commentsMeta);

  const commentsBody = createElement("div", "evaluation-section-body");
  commentsBody.style.display = "block";

  const commentsHelperBox = createElement(
    "div",
    "evaluation-section-helper"
  );
  commentsHelperBox.style.display = "none";
  commentsHelperBox.innerHTML = `
    <strong>Tips for comments:</strong>
    <ul>
      <li>You can mention what worked well and what could be improved.</li>
      <li>Be as specific as possible so your feedback is actionable.</li>
      <li>You do not need to include your name; keep it focused on the course.</li>
    </ul>
  `;
  commentsBody.appendChild(commentsHelperBox);

  commentsTooltip.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = commentsHelperBox.style.display === "none";
    commentsHelperBox.style.display = isHidden ? "block" : "none";
  });

  commentsHeader.addEventListener("click", () => {
    const isCollapsed = commentsBody.style.display === "none";
    commentsBody.style.display = isCollapsed ? "block" : "none";
    commentsSectionPanel.classList.toggle("collapsed", !isCollapsed);
  });

  const commentsInput = createInput({
    label: "Additional comments on the course and instruction *",
    id: "comments",
    type: "text",
    placeholder: "Please provide any additional feedback or suggestions...",
    onInput: (val) => {
      commentsValue = val;
      const answered = commentsValue && commentsValue.trim().length > 0;
      commentsProgressLabel.textContent = answered
        ? "1/1 answered"
        : "0/1 answered";
      updateOverallProgress();
    }
  });

  commentsBody.appendChild(commentsInput);
  commentsSectionPanel.appendChild(commentsHeader);
  commentsSectionPanel.appendChild(commentsBody);
  form.appendChild(commentsSectionPanel);

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
      updateSectionProgress(q.sectionId);
    });
    commentsValue = "";
    commentsProgressLabel.textContent = "0/1 answered";
    updateOverallProgress();
  });

  const wrapper = createElement("div");
  wrapper.appendChild(form);

  const title = enrollment
    ? "Course Evaluation Form"
    : "Course Evaluation Form (Demo Course)";

  const card = createCard(title, wrapper);
  content.appendChild(card);
}

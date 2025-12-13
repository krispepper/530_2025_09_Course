import { $, createElement } from "../components/domUtils.js";
import { createInput } from "../components/input.js";
import { createRadioGroup } from "../components/radioGroup.js";
import { createCard } from "../components/card.js";
import { showModal } from "../components/modal.js";
<<<<<<< Updated upstream
import { mockEnrollments } from "../data/mockEnrollments.js";
=======
>>>>>>> Stashed changes
import { authService } from "../services/authService.js";
import { evaluationService } from "../services/evaluationService.js";

export async function renderEvaluate(navigate) {
  const go = typeof navigate === "function" ? navigate : () => {};

  const user = await authService.getCurrentUser();
  if (!user) {
    go("/login");
    return;
  }

  const content = $("#app-content");
  content.innerHTML = "";

  const params = new URLSearchParams(window.location.search);
<<<<<<< Updated upstream
  const courseId = params.get("courseId");
  const evaluationId = params.get("evaluationId");
  const mode = params.get("mode") || "edit";
  const isViewOnly = mode === "view";
=======
  const courseId = params.get("courseId");
  const evaluationId = params.get("evaluationId");
  const mode = params.get("mode") || "edit";
  const isViewOnly = mode === "view";
>>>>>>> Stashed changes


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
    },
    {
      id: "comments",
      title: "Open Comments",
      description:
        "Use this space to share any additional feedback or suggestions about the course and instruction.",
      tooltip:
        "You can write anything that you think would help improve this course."
    }
  ];


<<<<<<< Updated upstream
  let evaluation = null;
  let questions = [];
  let dbQuestions = []; 
  let myResponse = null;

  const demoEnrollment =
    mockEnrollments?.find((c) => c.courseId === courseId) || null;

  const fallbackHeader = {
    title: demoEnrollment ? demoEnrollment.course : "Selected Course (Demo)",
    subtitle: demoEnrollment
      ? `Instructor: ${demoEnrollment.instructor}  •  Term: ${demoEnrollment.term}`
      : "Instructor: Demo Instructor  •  Term: Demo Term"
  };

  if (evaluationId) {
    try {
      const evaluationRes = await evaluationService.getEvaluation(evaluationId);
      evaluation = evaluationRes?.evaluation || evaluationRes;
=======
  if (!evaluationId) {
    showModal("Evaluation not available", "A valid evaluation ID is required.");
    go("/dashboard");
    return;
  }

  let evaluation = null;
  let questions = [];
  let dbQuestions = []; 
  let myResponse = null;

  if (evaluationId) {
    try {
      const evaluationRes = await evaluationService.getEvaluation(evaluationId);
      evaluation = evaluationRes?.evaluation || evaluationRes;
>>>>>>> Stashed changes

      dbQuestions = Array.isArray(evaluation?.questions)
        ? evaluation.questions
        : [];

      if (isViewOnly) {
        const resp = await evaluationService.getMyResponse(evaluationId);
        myResponse = resp?.response || null;
      }

      if (dbQuestions.length === 0) {
        showModal("No questions found", "This evaluation has no questions configured.");
        go("/dashboard");
        return;
      }

      const sectionOrder = [
        "course-structure",
        "course-structure",
        "learning-support",
        "learning-support",
        "engagement",
        "engagement",
        "materials",
        "materials"
      ];

      questions = dbQuestions.map((q, idx) => {
        const isText = q.questionType === "text";
        const sectionId = isText
          ? "comments"
          : (sectionOrder[idx] || "course-structure");

        return {
          name: String(q._id),              
          label: `${q.questionText}${q.isRequired ? " *" : ""}`,
          sectionId,
          questionType: q.questionType || "rating",
          isRequired: q.isRequired !== false
        };
      });

<<<<<<< Updated upstream
      const hasComments = questions.some((q) => q.sectionId === "comments");
      if (!hasComments) {
        questions.push({
          name: "__comments__",
          label: "Additional comments on the course and instruction *",
          sectionId: "comments",
          questionType: "text",
          isRequired: true
        });
      }
    } catch (err) {
      showModal(
        "Failed to load evaluation",
        err?.data?.message || "Please try again."
      );
      go("/dashboard");
      return;
    }
  } else {
    questions = [
      { name: "q1", label: "The course content was well organized. *", sectionId: "course-structure", questionType: "rating", isRequired: true },
      { name: "q2", label: "The instructor clearly explained course concepts. *", sectionId: "course-structure", questionType: "rating", isRequired: true },
      { name: "q3", label: "Feedback on assignments and assessments helped me improve my learning. *", sectionId: "learning-support", questionType: "rating", isRequired: true },
      { name: "q4", label: "Overall, I would recommend this course to other students. *", sectionId: "learning-support", questionType: "rating", isRequired: true },
      { name: "q5", label: "Class activities and discussions helped me stay engaged with the course material. *", sectionId: "engagement", questionType: "rating", isRequired: true },
      { name: "q6", label: "The instructor encouraged student participation and questions. *", sectionId: "engagement", questionType: "rating", isRequired: true },
      { name: "q7", label: "The course materials (e.g., slides, readings, videos) supported my learning effectively. *", sectionId: "materials", questionType: "rating", isRequired: true },
      { name: "q8", label: "Online resources and tools used in this course were easy to access and use. *", sectionId: "materials", questionType: "rating", isRequired: true },
      { name: "comments", label: "Additional comments on the course and instruction *", sectionId: "comments", questionType: "text", isRequired: true }
    ];
  }
=======
      // Use only questions from the server; do not add synthetic fields
    } catch (err) {
      showModal(
        "Failed to load evaluation",
        err?.data?.message || "Please try again."
      );
      go("/dashboard");
      return;
    }
  }
>>>>>>> Stashed changes

  const form = createElement("form", "form");

  const errorSummary = createElement("div", "error-summary");
  errorSummary.style.display = "none";
  form.appendChild(errorSummary);

  const headerWrapper = createElement("div", "evaluation-header");

<<<<<<< Updated upstream
  const headerMainText =
    evaluation?.title ||
    evaluation?.course?.courseName ||
    fallbackHeader.title;

  const headerMain = createElement("div", "evaluation-header-main", headerMainText);

  const headerSubText =
    evaluation?.course?.courseName
      ? `${evaluation.course.courseName}${evaluation.course.courseCode ? ` (${evaluation.course.courseCode})` : ""}  •  Instructor: ${evaluation?.instructor?.email || "Instructor"}`
      : fallbackHeader.subtitle;
=======
  const headerMainText =
    evaluation?.title ||
    evaluation?.course?.courseName ||
    "Course Evaluation";

  const headerMain = createElement("div", "evaluation-header-main", headerMainText);

  const headerSubText =
    evaluation?.course?.courseName
      ? `${evaluation.course.courseName}${evaluation.course.courseCode ? ` (${evaluation.course.courseCode})` : ""}  •  Instructor: ${evaluation?.instructor?.email || "Instructor"}`
      : "";
>>>>>>> Stashed changes

  const headerSub = createElement("div", "evaluation-header-sub", headerSubText);

  const headerNote = createElement(
    "p",
    "evaluation-header-note",
    isViewOnly
      ? "This is a read-only view of your submitted evaluation."
      : "Please respond to all required items marked with an asterisk (*)."
  );

  headerWrapper.appendChild(headerMain);
  headerWrapper.appendChild(headerSub);
  headerWrapper.appendChild(headerNote);

  const overallProgressWrapper = createElement("div", "overall-progress");
  const overallProgressLabel = createElement("div", "overall-progress-label", "Overall: 0/0 answered");
  const overallProgressBar = createElement("div", "overall-progress-bar");
  const overallProgressFill = createElement("div", "overall-progress-bar-fill");
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

  const answers = {};
  const sectionBodies = {};
  const sectionProgressLabels = {};

  if (isViewOnly && myResponse?.answers?.length) {
    myResponse.answers.forEach((a) => {
      if (a.questionId) answers[String(a.questionId)] = String(a.answerValue ?? "");
    });
  }

  function updateSectionProgress(sectionId) {
    const label = sectionProgressLabels[sectionId];
    if (!label) return;

    const sectionQs = questions.filter((q) => q.sectionId === sectionId);
    const total = sectionQs.length;

    const answeredCount = sectionQs.filter((q) => {
      const v = answers[q.name];
      return v && String(v).trim().length > 0;
    }).length;

    label.textContent = `${answeredCount}/${total} answered`;
  }

  function updateOverallProgress() {
    const requiredQs = questions.filter((q) => q.isRequired);
    const total = requiredQs.length;
    const answered = requiredQs.filter((q) => {
      const v = answers[q.name];
      return v && String(v).trim().length > 0;
    }).length;

    overallProgressLabel.textContent = `Overall: ${answered}/${total} answered`;

    const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
    overallProgressFill.style.width = pct + "%";
  }

  function createSectionPanel(section) {
    const sectionPanel = createElement("div", "evaluation-section-panel");

    const header = createElement("div", "evaluation-section-header");

    const titleWrapper = createElement("div", "evaluation-section-title-wrapper");
    const title = createElement("h3", "evaluation-section-title", section.title);
    const desc = createElement("p", "evaluation-section-description", section.description);
    titleWrapper.appendChild(title);
    titleWrapper.appendChild(desc);

    const metaWrapper = createElement("div", "evaluation-section-meta");

    const progressLabel = createElement("span", "evaluation-section-progress", "0/0 answered");
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
      helperBox.style.display = helperBox.style.display === "none" ? "block" : "none";
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
    const body = sectionBodies[q.sectionId] || form;

    if (q.questionType === "rating") {
      const group = createRadioGroup({
        label: q.label,
        name: q.name,
        options: likertOptions,
        value: answers[q.name] || "",
        onChange: (value) => {
          if (isViewOnly) return;
          answers[q.name] = value;
          updateSectionProgress(q.sectionId);
          updateOverallProgress();
        }
      });

      if (isViewOnly) {
        group.querySelectorAll("input").forEach((i) => (i.disabled = true));
      }

      body.appendChild(group);
      return;
    }

    const inputWrap = createInput({
      label: q.label,
      id: q.name,
      type: "text",
      placeholder: "Please provide any additional feedback or suggestions...",
      onInput: (val) => {
        if (isViewOnly) return;
        answers[q.name] = val;
        updateSectionProgress(q.sectionId);
        updateOverallProgress();
      }
    });

    const el = inputWrap.querySelector("input, textarea");
    if (el) el.value = answers[q.name] || "";
    if (isViewOnly && el) el.disabled = true;

    body.appendChild(inputWrap);
  });

  sections.forEach((s) => updateSectionProgress(s.id));
  updateOverallProgress();

  const actions = createElement("div", "form-actions");

  if (!isViewOnly) {
    const submitBtn = createElement("button", "btn btn-primary");
    submitBtn.type = "submit";
    submitBtn.textContent = "Submit Evaluation";
    actions.appendChild(submitBtn);
  } else {
    const backBtn = createElement("button", "btn btn-secondary");
    backBtn.type = "button";
    backBtn.textContent = "Back to Dashboard";
    backBtn.addEventListener("click", () => go("/dashboard"));
    actions.appendChild(backBtn);
  }

  form.appendChild(actions);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isViewOnly) return;

    const errors = [];
    questions.forEach((q) => {
      if (!q.isRequired) return;
      const v = answers[q.name];
      if (!v || String(v).trim() === "") {
        const labelText = q.label.replace(/\s*\*$/, "");
        errors.push(`Please respond to: "${labelText}".`);
      }
    });

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

    errorSummary.style.display = "none";

<<<<<<< Updated upstream
    if (!evaluationId) {
      showModal(
        "Thank you for your feedback",
        "Your course evaluation has been recorded for this demonstration."
      );

      form.reset();
      Object.keys(answers).forEach((k) => (answers[k] = ""));
      sections.forEach((s) => updateSectionProgress(s.id));
      updateOverallProgress();
      return;
    }

    const payloadAnswers = questions
      .filter((q) => q.name !== "__comments__") 
      .map((q) => {
        const dbQ = dbQuestions.find((x) => String(x._id) === String(q.name));
        return {
          questionId: String(q.name),
          questionText: dbQ?.questionText || q.label.replace(/\s*\*$/, ""),
          questionType: dbQ?.questionType || q.questionType,
          answerValue: String(answers[q.name] || "")
        };
      });

    if (questions.some((q) => q.name === "__comments__")) {
      payloadAnswers.push({
        questionId: "__comments__",
        questionText: "Additional comments on the course and instruction.",
        questionType: "text",
        answerValue: String(answers["__comments__"] || "")
      });
    }
=======
    const payloadAnswers = questions
      .map((q) => {
        const dbQ = dbQuestions.find((x) => String(x._id) === String(q.name));
        return {
          questionId: String(q.name),
          questionText: dbQ?.questionText || q.label.replace(/\s*\*$/, ""),
          questionType: dbQ?.questionType || q.questionType,
          answerValue: String(answers[q.name] || "")
        };
      });
>>>>>>> Stashed changes

    try {
      await evaluationService.submitEvaluation(evaluationId, { answers: payloadAnswers });

      showModal("Thank you for your feedback", "Your evaluation has been submitted successfully.");

      go("/dashboard");
    } catch (err) {
      showModal("Submission blocked", err?.data?.message || "Server error while submitting response.");
      go("/dashboard");
    }
  });

  const wrapper = createElement("div");
  wrapper.appendChild(form);

  const card = createCard("Course Evaluation Form", wrapper);
  content.appendChild(card);
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes

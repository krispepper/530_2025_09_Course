/* Sai Manoj Naidu*/

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderEvaluate } from "../js/pages/evaluationForm.js";

function setupDom(url = "http://localhost/evaluate?courseId=CS101") {
  const dom = new JSDOM(`<div id="app-content"></div>`, { url });

  global.window = dom.window;
  global.document = dom.window.document;

  if (!dom.window.HTMLElement.prototype.scrollIntoView) {
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  }

  return dom;
}

/* ----------------------------------------------------
   TEST 1 — Invalid submit should show validation errors
----------------------------------------------------- */
test("Evaluation Form - shows some validation errors on empty submit", () => {
  const dom = setupDom();

  renderEvaluate();

  const form = document.querySelector("form");
  const errorSummary = document.querySelector(".error-summary");

  assert.ok(form, "form should be rendered");
  assert.ok(errorSummary, "error summary element should exist");

  form.dispatchEvent(
    new dom.window.Event("submit", { bubbles: true, cancelable: true })
  );

  const text = errorSummary.textContent.trim();
  assert.ok(
    text.length > 0,
    "error summary should contain text when validation fails"
  );
});

/* ----------------------------------------------------
   TEST 2 — Valid submit should NOT crash and should accept rating + comments
----------------------------------------------------- */
test("Evaluation Form - accepts valid rating and comments on submit", () => {
  const dom = setupDom();

  renderEvaluate();

  const form = document.querySelector("form");
  const errorSummary = document.querySelector(".error-summary");
  const ratingInput = document.querySelector('input[name="q1"][value="4"]');
  const commentsField = document.getElementById("comments");

  assert.ok(form, "form should be rendered");
  assert.ok(errorSummary, "error summary should exist");
  assert.ok(ratingInput, "rating input (value=4) should exist");
  assert.ok(commentsField, "comments field should exist");

  ratingInput.checked = true;
  ratingInput.dispatchEvent(
    new dom.window.Event("change", { bubbles: true })
  );

  commentsField.value = "Great course!";
  commentsField.dispatchEvent(
    new dom.window.Event("input", { bubbles: true })
  );

  form.dispatchEvent(
    new dom.window.Event("submit", { bubbles: true, cancelable: true })
  );

  assert.equal(
    typeof commentsField.value,
    "string",
    "comments field should still be readable after submit"
  );
});

/* ----------------------------------------------------
   TEST 3 — Section progress updates when a question is answered
----------------------------------------------------- */
test("Evaluation Form - section progress updates when answering a question", () => {
  setupDom();
  renderEvaluate();

  const panels = Array.from(
    document.querySelectorAll(".evaluation-section-panel")
  );
  const courseOrgPanel = panels.find((p) => {
    const titleEl = p.querySelector(".evaluation-section-title");
    return titleEl && titleEl.textContent.includes("Course Organization");
  });

  assert.ok(courseOrgPanel, "Course Organization section panel should exist");

  const progressLabel = courseOrgPanel.querySelector(
    ".evaluation-section-progress"
  );
  assert.ok(progressLabel, "section progress label should exist");

  assert.equal(
    progressLabel.textContent.trim(),
    "0/2 answered",
    "initial section progress should be 0/2 answered"
  );

  const ratingInput = document.querySelector('input[name="q1"][value="5"]');
  assert.ok(ratingInput, "rating input for q1 should exist");

  ratingInput.checked = true;
  ratingInput.dispatchEvent(
    new window.Event("change", { bubbles: true })
  );

  assert.equal(
    progressLabel.textContent.trim(),
    "1/2 answered",
    "section progress should update to 1/2 answered after answering q1"
  );
});

/* ----------------------------------------------------
   TEST 4 — Overall progress and comments progress update correctly
----------------------------------------------------- */
test("Evaluation Form - overall progress and comments progress update with comments", () => {
  setupDom();
  renderEvaluate();

  const overallProgressLabel = document.querySelector(
    ".overall-progress-label"
  );
  assert.ok(overallProgressLabel, "overall progress label should exist");

  assert.equal(
    overallProgressLabel.textContent.trim(),
    "Overall: 0/9 answered",
    "initial overall progress should be 0/9"
  );

  const commentsField = document.getElementById("comments");
  assert.ok(commentsField, "comments field should exist");

  const panels = Array.from(
    document.querySelectorAll(".evaluation-section-panel")
  );
  const commentsPanel = panels.find((p) => {
    const titleEl = p.querySelector(".evaluation-section-title");
    return titleEl && titleEl.textContent.includes("Open Comments");
  });

  assert.ok(commentsPanel, "Open Comments section panel should exist");

  const commentsProgressLabel = commentsPanel.querySelector(
    ".evaluation-section-progress"
  );
  assert.ok(
    commentsProgressLabel,
    "comments section progress label should exist"
  );
  assert.equal(
    commentsProgressLabel.textContent.trim(),
    "0/1 answered",
    "initial comments progress should be 0/1 answered"
  );

  commentsField.value = "Some detailed feedback about the course.";
  commentsField.dispatchEvent(
    new window.Event("input", { bubbles: true })
  );

  assert.equal(
    commentsProgressLabel.textContent.trim(),
    "1/1 answered",
    "comments progress should show 1/1 after text is entered"
  );
  assert.equal(
    overallProgressLabel.textContent.trim(),
    "Overall: 1/9 answered",
    "overall progress should show 1/9 after only comments are answered"
  );
});

/* ----------------------------------------------------
   TEST 5 — Comments helper tooltip toggles helper box visibility
----------------------------------------------------- */
test("Evaluation Form - comments helper tooltip toggles helper box", () => {
  setupDom();
  renderEvaluate();

  const panels = Array.from(
    document.querySelectorAll(".evaluation-section-panel")
  );
  const commentsPanel = panels.find((p) => {
    const titleEl = p.querySelector(".evaluation-section-title");
    return titleEl && titleEl.textContent.includes("Open Comments");
  });

  assert.ok(commentsPanel, "Open Comments section panel should exist");

  const tooltip = commentsPanel.querySelector(".evaluation-section-tooltip");
  const helperBox = commentsPanel.querySelector(".evaluation-section-helper");

  assert.ok(tooltip, "comments tooltip should exist");
  assert.ok(helperBox, "comments helper box should exist");

  assert.equal(
    helperBox.style.display,
    "none",
    "helper box should start hidden"
  );

  // First click -> show
  tooltip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(
    helperBox.style.display,
    "block",
    "helper box should be visible after first click"
  );

  // Second click -> hide again
  tooltip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(
    helperBox.style.display,
    "none",
    "helper box should be hidden after second click"
  );
});
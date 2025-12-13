/* Sai Manoj Naidu */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

global.fetch = async (url, options = {}) => {
  if (url.includes("/api/auth/me")) {
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        user: { id: 1, role: "student", name: "Test Student" }
      })
    };
  }

  if (url.includes("/api/evaluations/") && !url.includes("/submit") && !url.includes("/my-response")) {
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        evaluation: {
          _id: "E1",
          title: "Software Development — Evaluations",
          course: { _id: "C1", courseName: "Software Development", courseCode: "CS101" },
          instructor: { email: "inst@test.edu" },
          questions: [
            { _id: "q1", questionText: "The course content was well organized.", questionType: "rating", isRequired: true },
            { _id: "q2", questionText: "The instructor clearly explained concepts.", questionType: "rating", isRequired: true },
            { _id: "q3", questionText: "What worked well in this course?", questionType: "text", isRequired: true }
          ]
        }
      })
    };
  }

  if (url.includes("/api/evaluations/") && url.includes("/submit")) {
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true })
    };
  }

  return {
    ok: false,
    headers: { get: () => "application/json" },
    json: async () => ({ message: "Unhandled fetch in test: " + url })
  };
};

const { renderEvaluate } = await import("../js/pages/evaluationForm.js");

function setupDom(url = "http://localhost/evaluate?evaluationId=E1&courseId=C1") {
  const dom = new JSDOM(`<div id="app-content"></div>`, { url });

  global.window = dom.window;
  global.document = dom.window.document;

  if (!dom.window.HTMLElement.prototype.scrollIntoView) {
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  }

  return dom;
}

function getFirstSectionProgressLabel() {
  return document.querySelector(".evaluation-section-progress");
}

function getOverallProgressLabel() {
  return document.querySelector(".overall-progress-label");
}

function getErrorSummary() {
  return document.querySelector(".error-summary");
}

function getAnyRadio() {
  return document.querySelector('input[type="radio"]');
}

function getRadioForQuestion(questionId, value = "5") {
  return document.querySelector(
    `input[type="radio"][name="${questionId}"][value="${value}"]`
  );
}

function getTextInputOrTextarea() {
  return document.querySelector("textarea") || document.querySelector('input[type="text"]');
}

/* ----------------------------------------------------
   TEST 1 — Renders evaluation + radios exist
----------------------------------------------------- */
test("Evaluation Form - renders questions when evaluationId is present", async () => {
  setupDom();
  await renderEvaluate(() => {});
  await flushPromises();

  const form = document.querySelector("form");
  assert.ok(form, "form should render");

  const anyRadio = getAnyRadio();
  assert.ok(anyRadio, "at least one rating radio should exist");

  const text = getTextInputOrTextarea();
  assert.ok(text, "a text input/textarea should exist");
});

/* ----------------------------------------------------
   TEST 2 — Empty submit shows validation errors
----------------------------------------------------- */
test("Evaluation Form - shows validation errors on empty submit", async () => {
  setupDom();
  await renderEvaluate(() => {});
  await flushPromises();

  const form = document.querySelector("form");
  const errorSummary = getErrorSummary();

  assert.ok(form);
  assert.ok(errorSummary);

  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flushPromises();

  assert.equal(errorSummary.style.display, "block");
  assert.ok(errorSummary.textContent.trim().length > 0, "Error summary should contain messages");
});

/* ----------------------------------------------------
   TEST 3 — Section progress updates after answering a rating
----------------------------------------------------- */
test("Evaluation Form - section progress updates when answering a rating", async () => {
  setupDom();
  await renderEvaluate(() => {});
  await flushPromises();

  const progress = getFirstSectionProgressLabel();
  assert.ok(progress, "section progress label should exist");

  const before = progress.textContent;

  const q1Radio = getRadioForQuestion("q1", "5");
  assert.ok(q1Radio, "q1 radio should exist");
  q1Radio.checked = true;
  q1Radio.dispatchEvent(new window.Event("change", { bubbles: true }));

  await flushPromises();

  const after = progress.textContent;
  assert.notEqual(after, before, "section progress text should change after answering");
});

/* ----------------------------------------------------
   TEST 4 — Overall progress updates after filling comments
----------------------------------------------------- */
test("Evaluation Form - overall progress updates when entering text", async () => {
  setupDom();
  await renderEvaluate(() => {});
  await flushPromises();

  const overall = getOverallProgressLabel();
  assert.ok(overall, "overall progress label should exist");

  const before = overall.textContent;

  const text = getTextInputOrTextarea();
  assert.ok(text, "text input/textarea should exist");

  text.value = "Great course!";
  text.dispatchEvent(new window.Event("input", { bubbles: true }));

  await flushPromises();

  const after = overall.textContent;
  assert.notEqual(after, before, "overall progress should change after entering text");
});

/* ----------------------------------------------------
   TEST 5 — Successful submit path does not crash (fills all required)
----------------------------------------------------- */
test("Evaluation Form - submits when required fields are answered", async () => {
  setupDom();
  await renderEvaluate(() => {});
  await flushPromises();

  const form = document.querySelector("form");
  assert.ok(form);

  const q1 = getRadioForQuestion("q1", "5");
  const q2 = getRadioForQuestion("q2", "5");
  assert.ok(q1);
  assert.ok(q2);

  q1.checked = true;
  q1.dispatchEvent(new window.Event("change", { bubbles: true }));

  q2.checked = true;
  q2.dispatchEvent(new window.Event("change", { bubbles: true }));

  const text = getTextInputOrTextarea();
  assert.ok(text);
  text.value = "Everything was structured well.";
  text.dispatchEvent(new window.Event("input", { bubbles: true }));

  await flushPromises();

  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flushPromises();

  const errorSummary = getErrorSummary();
  assert.ok(errorSummary);
  assert.notEqual(errorSummary.style.display, "block", "should not show validation errors after valid submit");
});

/* ----------------------------------------------------
   TEST 6 — Tooltip toggles helper box (kept from your original)
----------------------------------------------------- */
test("Evaluation Form - comments helper tooltip toggles helper box", async () => {
  setupDom();
  await renderEvaluate(() => {});
  await flushPromises();

  const tooltip = document.querySelector(".evaluation-section-tooltip");
  const helper = document.querySelector(".evaluation-section-helper");

  assert.ok(tooltip);
  assert.ok(helper);

  tooltip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(helper.style.display, "block");

  tooltip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(helper.style.display, "none");
});

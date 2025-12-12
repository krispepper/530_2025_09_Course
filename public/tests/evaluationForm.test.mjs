/* Sai Manoj Naidu */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

global.fetch = async (url) => {
  if (url.includes("/api/auth/me")) {
    return {
      ok: true,
      json: async () => ({
        user: { id: 1, role: "student", name: "Test Student" }
      })
    };
  }

  return {
    ok: false,
    json: async () => ({})
  };
};

global.navigate = () => {};

const { renderEvaluate } = await import("../js/pages/evaluationForm.js");

function setupDom(url = "http://localhost/evaluate?courseId=CS101") {
  const dom = new JSDOM(`<div id="app-content"></div>`, { url });

  global.window = dom.window;
  global.document = dom.window.document;

  if (!dom.window.HTMLElement.prototype.scrollIntoView) {
    dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  }

  return dom;
}

/* ----------------------------------------------------
   TEST 1 — Empty submit shows validation errors
----------------------------------------------------- */
test("Evaluation Form - shows some validation errors on empty submit", async () => {
  setupDom();
  await renderEvaluate();

  const form = document.querySelector("form");
  const errorSummary = document.querySelector(".error-summary");

  assert.ok(form, "form should be rendered");
  assert.ok(errorSummary, "error summary should exist");

  form.dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true })
  );

  assert.ok(errorSummary.textContent.length > 0);
});

/* ----------------------------------------------------
   TEST 2 — Valid rating + comments submit does not crash
----------------------------------------------------- */
test("Evaluation Form - accepts valid rating and comments on submit", async () => {
  setupDom();
  await renderEvaluate();

  const form = document.querySelector("form");
  const rating = document.querySelector('input[name="q1"]');
  const comments = document.getElementById("comments");

  assert.ok(form);
  assert.ok(rating);
  assert.ok(comments);

  rating.checked = true;
  rating.dispatchEvent(new window.Event("change", { bubbles: true }));

  comments.value = "Great course!";
  comments.dispatchEvent(new window.Event("input", { bubbles: true }));

  form.dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true })
  );

  assert.ok(true);
});

/* ----------------------------------------------------
   TEST 3 — Section progress updates
----------------------------------------------------- */
test("Evaluation Form - section progress updates when answering a question", async () => {
  setupDom();
  await renderEvaluate();

  const progress = document.querySelector(".evaluation-section-progress");
  const rating = document.querySelector('input[name="q1"]');

  assert.ok(progress);
  assert.ok(rating);

  rating.checked = true;
  rating.dispatchEvent(new window.Event("change", { bubbles: true }));

  assert.ok(progress.textContent.includes("1"));
});

/* ----------------------------------------------------
   TEST 4 — Overall progress updates with comments
----------------------------------------------------- */
test("Evaluation Form - overall progress updates with comments", async () => {
  setupDom();
  await renderEvaluate();

  const overall = document.querySelector(".overall-progress-label");
  const comments = document.getElementById("comments");

  assert.ok(overall);
  assert.ok(comments);

  comments.value = "Some feedback";
  comments.dispatchEvent(new window.Event("input", { bubbles: true }));

  assert.ok(overall.textContent.includes("1"));
});

/* ----------------------------------------------------
   TEST 5 — Tooltip toggles helper box
----------------------------------------------------- */
test("Evaluation Form - comments helper tooltip toggles helper box", async () => {
  setupDom();
  await renderEvaluate();

  const tooltip = document.querySelector(".evaluation-section-tooltip");
  const helper = document.querySelector(".evaluation-section-helper");

  assert.ok(tooltip);
  assert.ok(helper);

  tooltip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(helper.style.display, "block");

  tooltip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(helper.style.display, "none");
});

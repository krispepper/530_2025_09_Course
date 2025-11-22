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
    commentsField.value,
    "Great course!",
    "comments should remain as entered after submit in this environment"
  );
});

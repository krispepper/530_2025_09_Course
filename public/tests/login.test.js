/* Sohini Singaram */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderLogin } from "../js/pages/login.js";

function setupDom(url = "http://localhost/login") {
  const dom = new JSDOM(`<div id="app-content"></div>`, { url });

  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;

  return dom;
}

/* ----------------------------------------------------
   TEST 1 — Toggle between Login and Register panels
----------------------------------------------------- */
test("Login Page - toggles between Login and Register panels", () => {
  const dom = setupDom();

  let navigatedTo = null;
  const navigate = (path) => {
    navigatedTo = path;
  };

  renderLogin(navigate);

  const loginPanel = document.getElementById("auth-login-panel");
  const registerPanel = document.getElementById("auth-register-panel");
  const loginToggleBtn = document.querySelector(
    '.auth-toggle-btn[data-mode="login"]'
  );
  const registerToggleBtn = document.querySelector(
    '.auth-toggle-btn[data-mode="register"]'
  );

  assert.ok(loginPanel, "login panel should exist");
  assert.ok(registerPanel, "register panel should exist");

  assert.ok(
    !loginPanel.classList.contains("hidden"),
    "login panel should be visible by default"
  );
  assert.ok(
    registerPanel.classList.contains("hidden"),
    "register panel should be hidden by default"
  );


  registerToggleBtn.click();

  assert.ok(
    loginPanel.classList.contains("hidden"),
    "login panel should be hidden after switching to register"
  );
  assert.ok(
    !registerPanel.classList.contains("hidden"),
    "register panel should be visible after switching to register"
  );


  loginToggleBtn.click();

  assert.ok(
    !loginPanel.classList.contains("hidden"),
    "login panel should be visible again after switching back to login"
  );
  assert.ok(
    registerPanel.classList.contains("hidden"),
    "register panel should be hidden again after switching back to login"
  );

  assert.equal(navigatedTo, null, "no navigation should happen when just toggling");
});

/* ----------------------------------------------------
   TEST 2 — Successful login navigates based on role
----------------------------------------------------- */
test("Login Page - successful login for student navigates to /dashboard", async () => {
  const dom = setupDom();

  let navigatedTo = null;
  const navigate = (path) => {
    navigatedTo = path;
  };

  renderLogin(navigate);

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");

  assert.ok(emailInput, "login email input should exist");
  assert.ok(passwordInput, "login password input should exist");
  assert.ok(loginBtn, "login button should exist");
  assert.ok(loginError, "login error element should exist");

  // Use valid dummy credentials from DummyAuthService
  emailInput.value = "student@test.com";
  passwordInput.value = "123";

  loginBtn.click();

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    loginError.textContent.trim(),
    "",
    "no error message should be shown after successful login"
  );
  assert.equal(
    navigatedTo,
    "/dashboard",
    "student role should navigate to /dashboard"
  );
});

/* ----------------------------------------------------
   TEST 3 — Invalid login shows error and does NOT navigate
----------------------------------------------------- */
test("Login Page - invalid login shows error and does not navigate", async () => {
  const dom = setupDom();

  let navigatedTo = null;
  const navigate = (path) => {
    navigatedTo = path;
  };

  renderLogin(navigate);

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");

  assert.ok(emailInput, "login email input should exist");
  assert.ok(passwordInput, "login password input should exist");
  assert.ok(loginBtn, "login button should exist");
  assert.ok(loginError, "login error element should exist");

  // Use invalid credentials
  emailInput.value = "wrong@test.com";
  passwordInput.value = "badpass";

  loginBtn.click();

  await new Promise((resolve) => setTimeout(resolve, 0));

  const errorText = loginError.textContent.trim();
  assert.ok(
    errorText.length > 0,
    "error message should be shown after invalid login"
  );
  assert.equal(
    navigatedTo,
    null,
    "navigate should NOT be called for invalid login"
  );
});
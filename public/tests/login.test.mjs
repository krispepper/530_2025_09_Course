/* Sohini Singaram */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

global.fetch = async (url, options = {}) => {
  const body = JSON.parse(options.body || "{}");

  if (url.includes("/api/auth/login")) {
    if (body.email === "student@test.com" && body.password === "123") {
      return {
        ok: true,
        json: async () => ({
          user: { role: "student" }
        })
      };
    }

    return {
      ok: false,
      json: async () => ({
        message: "Invalid credentials"
      })
    };
  }

  return {
    ok: false,
    json: async () => ({})
  };
};

const { renderLogin } = await import("../js/pages/login.js");

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
  setupDom();

  let navigatedTo = null;
  const navigate = (path) => (navigatedTo = path);

  renderLogin(navigate);

  const loginPanel = document.getElementById("auth-login-panel");
  const registerPanel = document.getElementById("auth-register-panel");
  const loginToggleBtn = document.querySelector('.auth-toggle-btn[data-mode="login"]');
  const registerToggleBtn = document.querySelector('.auth-toggle-btn[data-mode="register"]');

  assert.ok(loginPanel);
  assert.ok(registerPanel);

  registerToggleBtn.click();
  assert.ok(loginPanel.classList.contains("hidden"));
  assert.ok(!registerPanel.classList.contains("hidden"));

  loginToggleBtn.click();
  assert.ok(!loginPanel.classList.contains("hidden"));
  assert.ok(registerPanel.classList.contains("hidden"));

  assert.equal(navigatedTo, null);
});

/* ----------------------------------------------------
   TEST 2 — Successful login → /dashboard
----------------------------------------------------- */
test("Login Page - successful login for student navigates to /dashboard", async () => {
  setupDom();

  let navigatedTo = null;
  const navigate = (path) => (navigatedTo = path);

  renderLogin(navigate);

  document.getElementById("login-email").value = "student@test.com";
  document.getElementById("login-password").value = "123";

  document.getElementById("login-btn").click();
  await new Promise((r) => setTimeout(r, 0));

  const loginError = document.getElementById("login-error");

  assert.equal(loginError.textContent.trim(), "");
  assert.equal(navigatedTo, "/dashboard");
});

/* ----------------------------------------------------
   TEST 3 — Invalid login → error shown
----------------------------------------------------- */
test("Login Page - invalid login shows error and does not navigate", async () => {
  setupDom();

  let navigatedTo = null;
  const navigate = (path) => (navigatedTo = path);

  renderLogin(navigate);

  document.getElementById("login-email").value = "wrong@test.com";
  document.getElementById("login-password").value = "badpass";

  document.getElementById("login-btn").click();
  await new Promise((r) => setTimeout(r, 0));

  const loginError = document.getElementById("login-error");

  assert.ok(loginError.textContent.trim().length > 0);
  assert.equal(navigatedTo, null);
});

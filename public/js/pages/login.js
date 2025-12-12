import { authService } from "../services/authService.js";

function defaultPathForRole(role) {
  if (role === "admin") return "/admin/reports";
  if (role === "instructor") return "/instructor/courses";
  return "/dashboard";
}

export function renderLogin(navigate) {
  const content = document.getElementById("app-content");
  if (!content) return;

  content.innerHTML = `
    <div class="auth-page">
      <div class="auth-card-main">
        <h1>Course Evaluation Portal</h1>

        <div class="auth-toggle">
          <button class="auth-toggle-btn auth-toggle-btn-active" data-mode="login">
            Login
          </button>
          <button class="auth-toggle-btn" data-mode="register">
            Register
          </button>
        </div>

        <!-- LOGIN PANEL -->
        <div id="auth-login-panel" class="auth-panel">
          <div class="auth-panel-header">Sign in</div>

          <div class="auth-form-field">
            <label for="login-email" class="auth-label">Email</label>
            <input id="login-email" type="email" class="auth-input" />
          </div>

          <div class="auth-form-field">
            <label for="login-password" class="auth-label">Password</label>
            <input id="login-password" type="password" class="auth-input" />
          </div>

          <div class="auth-actions">
            <button id="login-btn" class="auth-primary-btn">Login</button>
            <p id="login-error" class="error-message"></p>
          </div>

          <div class="auth-panel-footer">
            New here?
            <button type="button" id="link-to-register">Create an account</button>
          </div>
        </div>

        <!-- REGISTER PANEL -->
        <div id="auth-register-panel" class="auth-panel hidden">
          <div class="auth-panel-header">Create an account</div>

          <div class="auth-form-field">
            <label for="reg-email" class="auth-label">Email</label>
            <input id="reg-email" type="email" class="auth-input" />
          </div>

          <div class="auth-form-field">
            <label for="reg-password" class="auth-label">Password</label>
            <input id="reg-password" type="password" class="auth-input" />
          </div>

          <div class="auth-form-field">
            <label for="reg-role" class="auth-label">Role</label>
            <select id="reg-role" class="auth-select">
              <option value="">Select your role...</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="auth-actions">
            <button id="reg-btn" class="auth-primary-btn">Register</button>
            <p id="reg-error" class="error-message"></p>
          </div>

          <div class="auth-panel-footer">
            Already have an account?
            <button type="button" id="link-to-login">Login instead</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const loginPanel = document.getElementById("auth-login-panel");
  const registerPanel = document.getElementById("auth-register-panel");
  const toggleButtons = document.querySelectorAll(".auth-toggle-btn");

  const loginErrorEl = document.getElementById("login-error");
  const regErrorEl = document.getElementById("reg-error");

  function setMode(mode) {
    if (mode === "login") {
      loginPanel.classList.remove("hidden");
      registerPanel.classList.add("hidden");
    } else {
      loginPanel.classList.add("hidden");
      registerPanel.classList.remove("hidden");
    }

    toggleButtons.forEach((btn) => {
      btn.classList.toggle(
        "auth-toggle-btn-active",
        btn.dataset.mode === mode
      );
    });
  }

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  document.getElementById("link-to-register").onclick = () => setMode("register");
  document.getElementById("link-to-login").onclick = () => setMode("login");

  document.getElementById("login-btn").onclick = async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    loginErrorEl.textContent = "";

    try {
      const user = await authService.login(email, password);
      navigate(defaultPathForRole(user.role));
    } catch (err) {
      loginErrorEl.textContent = err.message;
    }
  };

  document.getElementById("reg-btn").onclick = async () => {
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const role = document.getElementById("reg-role").value;

    regErrorEl.textContent = "";

    try {
      const user = await authService.register({ email, password, role });
      regErrorEl.style.color = "#16a34a";
      regErrorEl.textContent = `Registered ${user.email} as ${user.role}. You can login now.`;
      setTimeout(() => setMode("login"), 800);
    } catch (err) {
      regErrorEl.style.color = "#b91c1c";
      regErrorEl.textContent = err.message;
    }
  };

  setMode("login");
}

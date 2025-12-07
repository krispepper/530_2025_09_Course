import { renderLogin } from "./pages/login.js";
import { authService } from "./services/authService.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderEvaluate } from "./pages/evaluationForm.js";
import { renderAdminReports } from "./pages/adminReports.js";
import { renderInstructorCourses } from "./pages/instructorCourses.js";
import { renderAdminEnrollment } from "./pages/adminEnrollment.js";

function getCurrentPath() {
  const path = window.location.pathname || "/";
  return path === "" ? "/" : path;
}

function defaultPathForRole(role) {
  if (role === "admin") return "/admin/reports";
  if (role === "instructor") return "/instructor/courses";
  return "/dashboard";
}

function updateHeaderUser(user) {
  const userEl = document.getElementById("header-user");
  const logoutBtn = document.getElementById("logout-btn");
  if (!userEl || !logoutBtn) return;

  if (!user) {
    userEl.textContent = "Not signed in";
    logoutBtn.classList.add("hidden");
  } else {
    userEl.textContent = `${user.email} (${user.role})`;
    logoutBtn.classList.remove("hidden");
  }
}

function updateNavVisibility(user) {
  const dashboardLink = document.querySelector('a[href="/dashboard"]');
  const evalLink = document.querySelector('a[href="/evaluate"]');
  const adminReportsLink = document.querySelector('a[href="/admin/reports"]');
  const adminEnrollLink = document.querySelector('a[href="/admin/enrollment"]');
  const instructorLink = document.querySelector('a[href="/instructor/courses"]');

  [
    dashboardLink,
    evalLink,
    adminReportsLink,
    adminEnrollLink,
    instructorLink
  ].forEach(el => el && el.classList.add("hidden"));

  if (!user) return;

  if (user.role === "student") {
    dashboardLink?.classList.remove("hidden");
    evalLink?.classList.remove("hidden");
  }

  if (user.role === "instructor") {
    instructorLink?.classList.remove("hidden");
  }

  if (user.role === "admin") {
    adminReportsLink?.classList.remove("hidden");
    adminEnrollLink?.classList.remove("hidden");
  }
}

function navigate(path) {
  window.history.pushState({}, "", path);
  handleRouteChange();
}

async function handleRouteChange() {
  let path = getCurrentPath();
  const user = await authService.getCurrentUser();

  updateHeaderUser(user);
  updateNavVisibility(user);

  if (path === "/") {
    path = user ? defaultPathForRole(user.role) : "/login";
    window.history.replaceState({}, "", path);
  }

  if (!user && path !== "/login") {
    window.history.replaceState({}, "", "/login");
    renderLogin(navigate);
    return;
  }

  if (user && path === "/login") {
    path = defaultPathForRole(user.role);
    window.history.replaceState({}, "", path);
  }

  if (path === "/login") {
    renderLogin(navigate);
  } 
  else if (path.startsWith("/dashboard")) {
    renderDashboard(navigate);
  } 
  else if (path.startsWith("/evaluate")) {
    renderEvaluate(navigate);
  }
  else if (path.startsWith("/admin/reports")) {
    renderAdminReports(navigate);
  }
  else if (path.startsWith("/admin/enrollment")) {
    renderAdminEnrollment(navigate);
  }
  else if (path.startsWith("/instructor/courses")) {
    renderInstructorCourses(navigate);
  }
  else {
    if (user) {
      const target = defaultPathForRole(user.role);
      window.history.replaceState({}, "", target);

      if (user.role === "admin") renderAdminReports(navigate);
      else if (user.role === "instructor") renderInstructorCourses(navigate);
      else renderDashboard(navigate);
    } else {
      window.history.replaceState({}, "", "/login");
      renderLogin(navigate);
    }
  }
}

function initNavigationLinks() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("a[data-link]");
    if (!target) return;

    const href = target.getAttribute("href");
    if (href && href.startsWith("/")) {
      event.preventDefault();
      navigate(href);
    }
  });

  window.addEventListener("popstate", handleRouteChange);
}

function initLogoutButton() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    await authService.logout();
    navigate("/login");
  });
}

function initApp() {
  initNavigationLinks();
  initLogoutButton();
  handleRouteChange();
}

document.addEventListener("DOMContentLoaded", initApp);

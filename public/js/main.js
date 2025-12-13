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

function updateActiveNav(path) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    if (link.getAttribute("href") === path) {
      link.classList.add("nav-link-active");
    } else {
      link.classList.remove("nav-link-active");
    }
  });
}

function updateHeaderUser(user) {
  const userEl = document.getElementById("header-user");
  const logoutBtn = document.getElementById("logout-btn");

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
  ].forEach((el) => {
    if (el) el.classList.add("hidden");
  });

  if (!user) return;

  if (user.role === "student") {
    dashboardLink?.classList.remove("hidden");
  }

<<<<<<< Updated upstream
  if (user.role === "instructor") {
    instructorLink?.classList.remove("hidden");
  }
=======
  if (user.role === "instructor") {
    instructorLink?.classList.remove("hidden");
  }
>>>>>>> Stashed changes

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
    if (!user) {
      navigate("/login");
      return;
    } else {
      navigate(defaultPathForRole(user.role));
      return;
    }
  }

  if (!user && path !== "/login") {
    navigate("/login");
    return;
  }

  if (user && path === "/login") {
    navigate(defaultPathForRole(user.role));
    return;
  }

  updateActiveNav(path);

  if (path === "/login") renderLogin(navigate);
  else if (path === "/dashboard") renderDashboard(navigate);
  else if (path === "/evaluate") renderEvaluate(navigate);
  else if (path === "/admin/reports") renderAdminReports(navigate);
  else if (path === "/admin/enrollment") renderAdminEnrollment(navigate);
  else if (path === "/instructor/courses") renderInstructorCourses(navigate);
  else navigate(defaultPathForRole(user?.role || "student"));
}

function initNavigationLinks() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("a[data-link]");
    if (!target) return;

    event.preventDefault();
    navigate(target.getAttribute("href"));
  });

  window.addEventListener("popstate", handleRouteChange);
}

function initLogoutButton() {
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", async () => {
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

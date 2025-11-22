import { } from "./components/domUtils.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderEvaluate } from "./pages/evaluationForm.js";
import { renderAdminReports } from "./pages/adminReports.js";
import { renderLogin } from "./pages/login.js";
import { authService } from "./services/authService.js";

function getCurrentPath() {
  const path = window.location.pathname || "/";
  return path === "" ? "/" : path;
}

function defaultPathForRole(role) {
  if (role === "admin") return "/admin/reports";
  return "/dashboard";
}

function updateActiveNav(path) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (path.startsWith(linkPath)) {
      link.classList.add("nav-link-active");
    } else {
      link.classList.remove("nav-link-active");
    }
  });
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
  const adminLink = document.querySelector('a[href="/admin/reports"]');

  [dashboardLink, evalLink, adminLink].forEach((el) => {
    if (el) el.style.display = "none";
  });

  if (!user) return;

  if (user.role === "student") {
    if (dashboardLink) dashboardLink.style.display = "block";
  } else if (user.role === "instructor") {
    if (dashboardLink) dashboardLink.style.display = "block";
  } else if (user.role === "admin") {
    if (adminLink) adminLink.style.display = "block";
  }
}

function navigate(path) {
  const current = getCurrentPath();
  if (current === path) {
    handleRouteChange();
    return;
  }
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
      path = "/login";
    } else {
      path = defaultPathForRole(user.role);
    }
    if (getCurrentPath() !== path) {
      window.history.replaceState({}, "", path);
    }
  }

  if (!user && path !== "/login") {
    path = "/login";
    if (getCurrentPath() !== path) {
      window.history.replaceState({}, "", path);
    }
  }

  if (user && path === "/login") {
    const target = defaultPathForRole(user.role);
    if (getCurrentPath() !== target) {
      window.history.replaceState({}, "", target);
    }
    path = target;
  }

  if (user) {
    if (path.startsWith("/admin/reports") && user.role !== "admin") {
      const target = defaultPathForRole(user.role);
      if (getCurrentPath() !== target) {
        window.history.replaceState({}, "", target);
      }
      path = target;
    }

    if (path.startsWith("/evaluate") && user.role !== "student") {
      const target = defaultPathForRole(user.role);
      if (getCurrentPath() !== target) {
        window.history.replaceState({}, "", target);
      }
      path = target;
    }
  }

  path = getCurrentPath();
  updateActiveNav(path);

  if (path === "/login") {
    renderLogin(navigate);
  } else if (path.startsWith("/dashboard")) {
    renderDashboard(navigate);
  } else if (path.startsWith("/evaluate")) {
    renderEvaluate();
  } else if (path.startsWith("/admin/reports")) {
    renderAdminReports();
  } else {
    if (user) {
      const target = defaultPathForRole(user.role);
      if (getCurrentPath() !== target) {
        window.history.replaceState({}, "", target);
      }
      renderDashboard(navigate);
    } else {
      if (getCurrentPath() !== "/login") {
        window.history.replaceState({}, "", "/login");
      }
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

  window.addEventListener("popstate", () => {
    handleRouteChange();
  });
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

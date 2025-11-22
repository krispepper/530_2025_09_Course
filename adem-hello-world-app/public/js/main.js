import { } from "./components/domUtils.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderEvaluate } from "./pages/evaluationForm.js";
import { renderAdminReports } from "./pages/adminReports.js";

function getCurrentPath() {
  return window.location.pathname || "/";
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

function navigate(path) {
  window.history.pushState({}, "", path);
  renderRoute();
}

function renderRoute() {
  const path = getCurrentPath();
  updateActiveNav(path);

  if (path === "/" || path === "") {
    navigate("/dashboard");
    return;
  }

  if (path.startsWith("/dashboard")) {
    renderDashboard(navigate);
  } else if (path.startsWith("/evaluate")) {
    renderEvaluate();
  } else if (path.startsWith("/admin/reports")) {
    renderAdminReports();
  } else {
    navigate("/dashboard");
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
    renderRoute();
  });
}

function initApp() {
  initNavigationLinks();
  renderRoute();
}

document.addEventListener("DOMContentLoaded", initApp);

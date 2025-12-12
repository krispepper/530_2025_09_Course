import { $, createElement } from "./domUtils.js";

export function showToast(message, type = "info", duration = 2000) {
  const root = $("#toast-root");
  root.innerHTML = "";

  const toast = createElement("div", `toast toast-${type}`);
  const span = createElement("span", null, message);
  const closeBtn = createElement("button", "toast-close", "×");

  closeBtn.addEventListener("click", () => {
    root.innerHTML = "";
  });

  toast.appendChild(span);
  toast.appendChild(closeBtn);
  root.appendChild(toast);

  setTimeout(() => {
    root.innerHTML = "";
  }, duration);
}

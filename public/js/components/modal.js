import { $, createElement } from "./domUtils.js";
import { createButton } from "./button.js";

export function showModal(title, message) {
  const root = $("#modal-root");
  root.innerHTML = "";

  const backdrop = createElement("div", "modal-backdrop");
  const modal = createElement("div", "modal");

  const header = createElement("div", "modal-header");
  const h3 = createElement("h3", null, title);
  const closeBtn = createElement("button", "modal-close", "×");
  closeBtn.addEventListener("click", closeModal);

  header.appendChild(h3);
  header.appendChild(closeBtn);

  const body = createElement("div", "modal-body", message);

  const footer = createElement("div", "modal-footer");
  const closeButton = createButton("Close", "secondary", closeModal);
  footer.appendChild(closeButton);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

export function closeModal() {
  const root = $("#modal-root");
  if (root) root.innerHTML = "";
  window.location.href = "/dashboard";
}

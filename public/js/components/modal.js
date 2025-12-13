import { createElement } from "./domUtils.js";

let modalRoot = null;

function ensureModalRoot() {
  if (modalRoot) return modalRoot;

  modalRoot = document.createElement("div");
  modalRoot.id = "app-modal-root";
  document.body.appendChild(modalRoot);

  return modalRoot;
}

export function showModal(title, message) {
  const root = ensureModalRoot();
  root.innerHTML = "";

  const overlay = createElement("div", "modal-overlay");
  const dialog = createElement("div", "modal-dialog");

  const h = createElement("h3", "modal-title", title || "Message");
  const p = createElement("p", "modal-message", message || "");

  const actions = createElement("div", "modal-actions");
  const closeBtn = createElement("button", "btn btn-primary", "OK");

  closeBtn.addEventListener("click", () => {
    root.innerHTML = "";
  });

  overlay.addEventListener("click", () => {
    root.innerHTML = "";
  });
  dialog.addEventListener("click", (e) => e.stopPropagation());

  actions.appendChild(closeBtn);
  dialog.appendChild(h);
  dialog.appendChild(p);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);
  root.appendChild(overlay);
}

export function showLargeModal(title, contentNode, onClose, closeLabel = "Back to Reports") {
  const root = ensureModalRoot();
  root.innerHTML = "";

  const overlay = createElement("div", "modal-overlay");

  const dialog = createElement("div", "modal-dialog modal-dialog-large");

  const header = createElement("div", "modal-header");
  const h = createElement("h3", "modal-title", title || "Details");

  const xBtn = createElement("button", "modal-x", "×");
  xBtn.type = "button";
  xBtn.addEventListener("click", () => {
    root.innerHTML = "";
    if (typeof onClose === "function") onClose();
  });

  header.appendChild(h);
  header.appendChild(xBtn);

  const body = createElement("div", "modal-body modal-body-scroll");
  if (contentNode) body.appendChild(contentNode);

  const actions = createElement("div", "modal-actions");
  const closeBtn = createElement("button", "btn btn-secondary", closeLabel);

  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => {
    root.innerHTML = "";
    if (typeof onClose === "function") onClose();
  });

  actions.appendChild(closeBtn);

  overlay.addEventListener("click", () => {
    root.innerHTML = "";
    if (typeof onClose === "function") onClose();
  });
  dialog.addEventListener("click", (e) => e.stopPropagation());

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(actions);

  overlay.appendChild(dialog);
  root.appendChild(overlay);
}

export function closeModal() {
  const root = ensureModalRoot();
  root.innerHTML = "";
}

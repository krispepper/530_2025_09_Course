import { createElement } from "./domUtils.js";

export function createButton(text, variant = "primary", onClick, attrs = {}) {
  const btn = createElement("button", `btn btn-${variant}`);
  btn.textContent = text;

  if (onClick) {
    btn.addEventListener("click", onClick);
  }

  Object.keys(attrs).forEach((key) => {
    btn.setAttribute(key, attrs[key]);
  });

  return btn;
}

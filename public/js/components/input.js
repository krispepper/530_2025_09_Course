import { createElement } from "./domUtils.js";

export function createInput(options = {}) {
  const wrapper = createElement("div", "form-field");

  if (options.label) {
    const label = createElement("label", "form-label", options.label);
    if (options.id) label.setAttribute("for", options.id);
    wrapper.appendChild(label);
  }

  const input = createElement("input", "form-input");
  if (options.id) input.id = options.id;
  if (options.type) input.type = options.type;
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.value) input.value = options.value;

  if (options.onInput) {
    input.addEventListener("input", (e) => options.onInput(e.target.value));
  }

  wrapper.appendChild(input);
  return wrapper;
}

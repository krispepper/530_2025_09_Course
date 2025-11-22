import { createElement } from "./domUtils.js";

export function createSelect(options = {}) {
  const wrapper = createElement("div", "form-field");

  if (options.label) {
    const label = createElement("label", "form-label", options.label);
    if (options.id) label.setAttribute("for", options.id);
    wrapper.appendChild(label);
  }

  const select = createElement("select", "form-input");
  if (options.id) select.id = options.id;

  (options.options || []).forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  });

  if (options.onChange) {
    select.addEventListener("change", (e) => options.onChange(e.target.value));
  }

  wrapper.appendChild(select);
  return wrapper;
}

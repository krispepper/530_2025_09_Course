import { createElement } from "./domUtils.js";

export function createRadioGroup(options = {}) {
  const wrapper = createElement("div", "form-field");

  if (options.label) {
    const label = createElement("div", "form-label", options.label);
    wrapper.appendChild(label);
  }

  const group = createElement("div", "radio-group");

  (options.options || []).forEach((opt) => {
    const label = createElement("label", "radio-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = options.name;
    input.value = opt.value;
    if (options.value === opt.value) {
      input.checked = true;
    }
    input.addEventListener("change", () => {
      if (options.onChange) options.onChange(opt.value);
    });

    const span = document.createElement("span");
    span.textContent = opt.label;

    label.appendChild(input);
    label.appendChild(span);
    group.appendChild(label);
  });

  wrapper.appendChild(group);
  return wrapper;
}

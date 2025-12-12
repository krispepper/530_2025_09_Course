import { createElement } from "./domUtils.js";

export function createCard(title, bodyElement) {
  const card = createElement("section", "card");

  if (title) {
    const h2 = createElement("h2", "card-title", title);
    card.appendChild(h2);
  }

  const body = createElement("div", "card-body");
  if (bodyElement) {
    body.appendChild(bodyElement);
  }

  card.appendChild(body);
  return card;
}

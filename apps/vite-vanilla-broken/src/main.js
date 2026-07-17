import setupLocatorUI from "@treelocator/runtime";

// Start TreeLocator. It will attach and highlight elements on Alt+hover, but
// because this page has no component/source metadata, Alt+click falls back to
// copying a plain CSS selector instead of a component ancestry chain.
setupLocatorUI();

// --- Plain, imperative DOM wiring (no components anywhere) ---

const countEl = document.querySelector("#count");
let count = 0;
const render = () => {
  countEl.textContent = String(count);
};
document.querySelector("#inc").addEventListener("click", () => {
  count += 1;
  render();
});
document.querySelector("#dec").addEventListener("click", () => {
  count -= 1;
  render();
});

document.querySelector("#greet").addEventListener("click", () => {
  const name = document.querySelector("#name").value.trim() || "stranger";
  const mood = document.querySelector("#mood").value;
  document.querySelector("#greeting").textContent = `Hello ${name} — feeling ${mood}?`;
});

let itemCount = 3;
document.querySelector("#add").addEventListener("click", () => {
  itemCount += 1;
  const li = document.createElement("li");
  li.textContent = `Item ${itemCount}`;
  document.querySelector("#list").appendChild(li);
});

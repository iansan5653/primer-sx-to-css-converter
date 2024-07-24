import {convert} from "./convert";

const inputElement = document.getElementById("input") as HTMLTextAreaElement;
const outputElement = document.getElementById("output") as HTMLOutputElement;

inputElement.addEventListener("input", () => {
  try {
    const cssProperties = convert(inputElement.value);
    outputElement.textContent = Array.from(cssProperties).join("\n");
  } catch (e) {
    outputElement.textContent = (e as Error).toString();
  }
});

inputElement.addEventListener("focus", () => {
  inputElement.select();
});

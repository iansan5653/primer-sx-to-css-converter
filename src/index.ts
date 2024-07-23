import * as ts from "typescript";

const inputElement = document.getElementById("input") as HTMLTextAreaElement;
const outputElement = document.getElementById("output") as HTMLOutputElement;

inputElement.addEventListener("input", () => {
  const inputTs = inputElement.value;

  const sourceFile = ts.createSourceFile(
    "input.ts",
    inputTs,
    ts.ScriptTarget.ESNext
  );

  const printer = ts.createPrinter();

  outputElement.textContent = printer.printFile(sourceFile);
});

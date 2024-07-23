import * as ts from "typescript";

const inputElement = document.getElementById("input") as HTMLTextAreaElement;
const outputElement = document.getElementById("output") as HTMLOutputElement;

/** Wrapper around TS API. */
class Node {
  constructor(readonly sourceNode: ts.Node) {}

  get children() {
    const result: Node[] = [];

    ts.forEachChild(this.sourceNode, (child) => {
      result.push(new Node(child));
    });

    return result;
  }

  get kind() {
    return this.sourceNode.kind;
  }

  debug() {
    const kind = ts.SyntaxKind[this.sourceNode.kind];
    console.groupCollapsed(kind);
    for (const child of this.children) child.debug();
    console.groupEnd();
  }
}

inputElement.addEventListener("input", () => {
  const inputTs = `const x = ${inputElement.value}`;

  const sourceFile = new Node(
    ts.createSourceFile("input.ts", inputTs, ts.ScriptTarget.ESNext)
  );

  const objectExpression =
    sourceFile.children[0]?.children[0]?.children[0]?.children[1];

  if (objectExpression?.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
    outputElement.textContent = "Error: Input must be an object";
    return;
  }
});

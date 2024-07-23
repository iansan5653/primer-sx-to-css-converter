import * as ts from "typescript";

const inputElement = document.getElementById("input") as HTMLTextAreaElement;
const outputElement = document.getElementById("output") as HTMLOutputElement;

/** Wrapper around TS API. */
class ChildWalker {
  constructor(readonly sourceNode: ts.Node) {}

  get children() {
    const result: ChildWalker[] = [];

    ts.forEachChild(this.sourceNode, (child) => {
      result.push(new ChildWalker(child));
    });

    return result;
  }

  debug() {
    const kind = ts.SyntaxKind[this.sourceNode.kind];
    console.groupCollapsed(kind);
    for (const child of this.children) child.debug();
    console.groupEnd();
  }
}

function getPropertyName({name}: ts.ObjectLiteralElementLike) {
  if (name && (ts.isLiteralExpression(name) || ts.isIdentifier(name)))
    return name.text;
  return null;
}

function propertyToCSSRule(property: ts.ObjectLiteralElementLike) {
  const name = getPropertyName(property);

  if (!name) return `/* Unable to parse "${property.getFullText()}" */`;

  return `${name}: unset;`;
}

inputElement.addEventListener("input", () => {
  const inputTs = `const x = ${inputElement.value}`;

  const sourceFile = new ChildWalker(
    ts.createSourceFile("input.ts", inputTs, ts.ScriptTarget.ESNext, true)
  );

  const objectExpression =
    sourceFile.children[0]?.children[0]?.children[0]?.children[1]?.sourceNode;

  if (!objectExpression || !ts.isObjectLiteralExpression(objectExpression)) {
    outputElement.textContent = "Error: Input must be an object";
    return;
  }

  outputElement.innerHTML = objectExpression.properties
    .map(propertyToCSSRule)
    .join("<br />");
});

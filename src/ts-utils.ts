import * as ts from "typescript";

/** TypeScript API helper for getting children of a node. */
export class ChildWalker {
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


export function getPropertyName({name}: ts.ObjectLiteralElementLike) {
  if (name && (ts.isLiteralExpression(name) || ts.isIdentifier(name)))
    return name.text;
  return null;
}

export function getPropertyValueExpression(property: ts.ObjectLiteralElementLike) {
  if (!ts.isPropertyAssignment(property)) return null;
  return property.initializer;
}

export function getArrayValues(array: ts.ArrayLiteralExpression) {
  const values: string[] = [];

  for (const element of array.elements)
    if (ts.isLiteralExpression(element)) values.push(element.text);
    else return null;

  return values;
}

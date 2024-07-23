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

function getPropertyValueExpression(property: ts.ObjectLiteralElementLike) {
  if (!ts.isPropertyAssignment(property)) return null;
  return property.initializer;
}

function kebabCase(name: string) {
  return name.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

const nameShorthands: Partial<Record<string, string[]>> = {
  p: ["padding"],
  pr: ["padding-right"],
  pl: ["padding-left"],
  pt: ["padding-top"],
  pb: ["padding-bottom"],
  px: ["padding-left", "padding-right"],
  py: ["padding-top", "padding-bottom"],
  m: ["margin"],
  mr: ["margin-right"],
  ml: ["margin-left"],
  mt: ["margin-top"],
  mb: ["margin-bottom"],
  mx: ["margin-left", "margin-right"],
  my: ["margin-top", "margin-bottom"],
};

function transformPropertyName(name: string) {
  const kebab = kebabCase(name);
  return nameShorthands[kebab] ?? [kebab];
}

const spacingVariables: Partial<Record<string, string>> = {
  "1": "--base-size-4",
  "2": "--base-size-8",
  "3": "--base-size-16",
  "4": "--base-size-24",
  "5": "--base-size-32",
  "6": "--base-size-40",
  "7": "--base-size-48",
  "8": "--base-size-64",
  "9": "--base-size-80",
  "10": "--base-size-96",
  "11": "--base-size-112",
  "12": "--base-size-128",
};

const gapVariables: Partial<Record<string, string>> = {
  ...spacingVariables,
  "2": "--stack-gap-condensed",
  "3": "--stack-gap-normal",
  "4": "--stack-gap-spacious",
};

const colorVariables: Partial<Record<string, string>> = {
  "canvas.default": "--bgColor-default",
  "canvas.overlay": "--overlay-bgColor",
  "canvas.inset": "--bgColor-inset",
  "canvas.subtle": "--bgColor-muted",
  "fg.default": "--fgColor-default",
  "fg.muted": "--fgColor-muted",
  "fg.subtle": "--fgColor-muted",
  "fg.onEmphasis": "--fgColor-onEmphasis",
  "border.default": "--borderColor-default",
  "border.muted": "--borderColor-muted",
  "border.subtle": "--borderColor-muted",
};

for (const colorGroup of [
  "accent",
  "success",
  "attention",
  "severe",
  "danger",
  "open",
  "closed",
  "done",
  "sponsors",
]) {
  colorVariables[`${colorGroup}.fg`] = `--fgColor-${colorGroup}`;
  colorVariables[`${colorGroup}.emphasis`] = `--bgColor-${colorGroup}-emphasis`;
  colorVariables[`${colorGroup}.muted`] = `--borderColor-${colorGroup}-muted`;
  colorVariables[`${colorGroup}.subtle`] = `--bgColor-${colorGroup}-muted`;
}

const fontSizeVariables: Partial<Record<string, string>> = {
  "0": "--text-body-size-small",
  "1": "--text-body-size-medium",
  "2": "--text-body-size-large, --text-title-size-small",
  "3": "--text-title-size-medium",
  "4": "--base-size-24",
  "5": "--text-title-size-large",
  "6": "--base-size-40",
  "7": "--base-size-48",
  "8": "--base-size-56",
};

const fontFamilyVariables: Partial<Record<string, string>> = {
  normal: "--fontStack-system",
  mono: "--fontStack-monospace",
};

const borderVariables: Partial<Record<string, string>> = {
  "1px": "--borderWidth-thin",
  "2px": "--borderWidth-thick",
  "3px": "--borderWidth-thicker",
};

const borderRadiusVariables: Partial<Record<string, string>> = {
  "1": "--borderRadius-small",
  "2": "--borderRadius-medium",
  "12px": "--borderRadius-large",
  "50%": "--borderRadius-full",
  "100%": "--borderRadius-full",
};

function replaceShorthands(
  value: string,
  variables: Partial<Record<string, string>>
) {
  let result = value;
  // yeah this is horribly inefficient I know
  for (const [shorthand, variable] of Object.entries(variables))
    result = result.replaceAll(
      RegExp(`(?:\s|^)${shorthand}(?:\s|$)`, "g"),
      `var(${variable})`
    );

  return result;
}

function expandValueShorthands(name: string, value: string) {
  // always replace colors
  let result = replaceShorthands(value, colorVariables);

  if (name.startsWith("padding") || name.startsWith("margin"))
    result = replaceShorthands(value, spacingVariables);
  else if (name === "gap") result = replaceShorthands(value, gapVariables);
  else if (name === "font-size")
    result = replaceShorthands(value, fontSizeVariables);
  else if (name === "font-family")
    result = replaceShorthands(value, fontFamilyVariables);
  else if (name.startsWith("border-radius"))
    result = replaceShorthands(value, borderRadiusVariables);
  else if (name.startsWith("border"))
    result = replaceShorthands(value, borderVariables);

  // if just a number that doesn't match a shorthand, fall back to px
  if (result.match(/^\d+$/) && result !== "0") result = `${result}px`;

  return result;
}

function getArrayValues(array: ts.ArrayLiteralExpression) {
  const values = [];

  for (const element of array.elements)
    if (ts.isLiteralExpression(element)) values.push(element.text);
    else return null;

  return values;
}

const breakpointValues = [, "544px", "768px", "1012px", "1280px"];

type CSSValue = string | CSSBlock;

class CSSBlock {
  constructor(readonly expressions: CSSExpression[]) {}

  toString() {
    return `{
  ${this.expressions.flatMap((exp) => exp.toString().split("\n")).join("\n  ")}
}`;
  }
}

class CSSRule {
  constructor(readonly name: string, readonly value: CSSValue) {}

  toString() {
    return `${this.name}: ${this.value}${
      typeof this.value === "string" ? ";" : ""
    }`;
  }
}

class CSSQuery {
  constructor(readonly expression: string, readonly rules: CSSBlock) {}

  toString() {
    return `${this.expression} ${this.rules}`;
  }
}

class CSSComment {
  constructor(readonly value: string) {}

  toString() {
    return `/* ${this.value} */`;
  }
}

type CSSExpression = CSSRule | CSSQuery | CSSComment;

function* arrayToResponsiveCSS(
  ruleName: string,
  array: ts.ArrayLiteralExpression
): Generator<CSSExpression> {
  const responsiveValues = getArrayValues(array);
  if (!responsiveValues) {
    throw new Error(`Unsupported responsive array expression`);
  }

  for (const [index, responsiveValue] of responsiveValues.entries()) {
    // Default first value is plain rule:
    if (index === 0) yield new CSSRule(ruleName, responsiveValue);

    const breakpoint = breakpointValues[index];
    if (!breakpoint)
      // we don't want to error here since we may already have yielded several rules
      yield new CSSComment(
        `Unknown breakpoint for "${responsiveValue}" in "${ruleName}" rule`
      );

    yield new CSSQuery(
      `@media screen and (min-width: ${breakpoint})`,
      new CSSBlock([new CSSRule(ruleName, responsiveValue)])
    );
  }
}

function* propertyToCSSRules(
  property: ts.ObjectLiteralElementLike
): Generator<CSSExpression> {
  try {
    const name = getPropertyName(property);
    if (!name) throw new Error(`Unsupported name expression`);

    const value = getPropertyValueExpression(property);
    if (!value) throw new Error(`Unsupported property expression`);

    // One property can become multiple rules, ie in the case of `py`
    for (const ruleName of transformPropertyName(name)) {
      if (ts.isLiteralExpression(value)) {
        // plain rule
        yield new CSSRule(
          ruleName,
          expandValueShorthands(ruleName, value.text)
        );
      } else if (ts.isObjectLiteralExpression(value)) {
        // nested rule, ie ":hover"
        yield new CSSRule(ruleName, objectToCSSBlock(value));
      } else if (ts.isArrayLiteralExpression(value)) {
        // responsive value, becomes nested at-rule
        yield* arrayToResponsiveCSS(ruleName, value);
      } else {
        throw new Error(`Unsupported value expression`);
      }
    }
  } catch (e) {
    yield new CSSComment(
      `Unable to transform \`${property.getFullText()}\`: ${
        (e as Error).message
      }`
    );
  }
}

function* propertiesToCSSRules(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike>
) {
  for (const property of properties) yield* propertyToCSSRules(property);
}

function objectToCSSBlock(object: ts.ObjectLiteralExpression) {
  return new CSSBlock(Array.from(propertiesToCSSRules(object.properties)));
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
  outputElement.textContent = objectToCSSBlock(objectExpression).toString();
});

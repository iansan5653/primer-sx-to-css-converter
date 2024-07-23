import * as ts from "typescript";

import {expandValueShorthands} from "./value-shorthands";
import {nameShorthands} from "./name-shorthands";
import * as css from "./css";
import * as tsUtils from "./ts-utils";

const inputElement = document.getElementById("input") as HTMLTextAreaElement;
const outputElement = document.getElementById("output") as HTMLOutputElement;

function kebabCase(name: string) {
  return name.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function transformPropertyName(name: string) {
  const kebab = kebabCase(name);
  return nameShorthands[kebab] ?? [kebab];
}

const breakpointValues = [, "544px", "768px", "1012px", "1280px"];

function* arrayToResponsiveCSS(
  ruleName: string,
  array: ts.ArrayLiteralExpression
): Generator<css.Expression> {
  const responsiveValues = tsUtils.getArrayValues(array);
  if (!responsiveValues) {
    throw new Error(`Unsupported responsive array expression`);
  }

  for (const [index, responsiveValue] of responsiveValues.entries()) {
    // Default first value is plain rule:
    if (index === 0) yield new css.Rule(ruleName, responsiveValue);

    const breakpoint = breakpointValues[index];
    if (!breakpoint)
      // we don't want to error here since we may already have yielded several rules
      yield new css.Comment(
        `Unknown breakpoint for "${responsiveValue}" in "${ruleName}" rule`
      );

    yield new css.Block(`@media screen and (min-width: ${breakpoint})`, [
      new css.Rule(ruleName, responsiveValue),
    ]);
  }
}

function* propertyToCSSRules(
  property: ts.ObjectLiteralElementLike
): Generator<css.Expression> {
  try {
    const name = tsUtils.getPropertyName(property);
    if (!name) throw new Error(`Unsupported name expression`);

    const value = tsUtils.getPropertyValueExpression(property);
    if (!value) throw new Error(`Unsupported property expression`);

    // One property can become multiple rules, ie in the case of `py`
    for (const ruleName of transformPropertyName(name)) {
      if (ts.isLiteralExpression(value)) {
        // plain rule
        yield new css.Rule(
          ruleName,
          expandValueShorthands(ruleName, value.text)
        );
      } else if (ts.isObjectLiteralExpression(value)) {
        // nested rule, ie ":hover"
        yield new css.Block(
          ruleName,
          Array.from(propertiesToCSSRules(value.properties))
        );
      } else if (ts.isArrayLiteralExpression(value)) {
        // responsive value, becomes nested at-rule
        yield* arrayToResponsiveCSS(ruleName, value);
      } else {
        throw new Error(`Unsupported value expression`);
      }
    }
  } catch (e) {
    yield new css.Comment(
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

inputElement.addEventListener("input", () => {
  let input = inputElement.value;

  // auto wrap in braces if the user pasted part of an object
  const trimmed = input.trim();
  const hasBraces = trimmed.startsWith("{") || trimmed.endsWith("}");
  if (!hasBraces) input = `{${input}}`;

  const inputTs = `const _ = ${input}`;

  const sourceFile = new tsUtils.ChildWalker(
    ts.createSourceFile("input.ts", inputTs, ts.ScriptTarget.ESNext, true)
  );

  sourceFile.debug();

  const objectExpression =
    sourceFile.children[0]?.children[0]?.children[0]?.children[1]?.sourceNode;

  if (!objectExpression || !ts.isObjectLiteralExpression(objectExpression)) {
    outputElement.textContent = "Error: Input must be an object";
    return;
  }
  outputElement.textContent = Array.from(
    propertiesToCSSRules(objectExpression.properties)
  ).join("\n");
});

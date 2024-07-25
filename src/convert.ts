import * as ts from "typescript";

import {expandValueShorthands} from "./value-shorthands";
import {nameShorthands} from "./name-shorthands";
import * as css from "./css";
import * as tsUtils from "./ts-utils";

function kebabCase(name: string) {
  return name.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function transformPropertyName(name: string) {
  const kebab = kebabCase(name);
  return nameShorthands[kebab] ?? [kebab];
}

const breakpointValues = [, "544px", "768px", "1012px", "1280px"];

function responsiveValueToBreakpoint(
  ruleName: string,
  value: string,
  index: number
) {
  // Default first value is plain rule:
  if (index === 0) return new css.Rule(ruleName, value);

  const breakpoint = breakpointValues[index];
  if (!breakpoint)
    throw new Error(
      `Breakpoint out of bounds for "${value}" in "${ruleName}" rule`
    );

  return new css.Block(`@media screen and (min-width: ${breakpoint})`, [
    new css.Rule(ruleName, value),
  ]);
}

function arrayToResponsiveCSS(
  ruleName: string,
  array: ts.ArrayLiteralExpression
) {
  const responsiveValues = tsUtils.getArrayValues(array);

  if (!responsiveValues)
    throw new Error(`Unsupported responsive array expression`);

  return responsiveValues.map((value, index) => {
    try {
      return responsiveValueToBreakpoint(ruleName, value, index);
    } catch (e) {
      return new css.Comment((e as Error).toString());
    }
  });
}

function* propertyToCSSRules(
  property: ts.ObjectLiteralElementLike
): Generator<css.Expression, undefined, undefined> {
  try {
    const name = tsUtils.getPropertyName(property);
    if (!name) throw new Error(`Unsupported name expression`);

    const value = tsUtils.getPropertyValueExpression(property);
    if (!value) throw new Error(`Unsupported property expression`);

    // One property can become multiple rules, ie in the case of `py`
    for (const ruleName of transformPropertyName(name))
      if (ts.isLiteralExpression(value))
        yield new css.Rule(
          ruleName,
          expandValueShorthands(ruleName, value.text)
        );
      else if (ts.isObjectLiteralExpression(value))
        yield new css.Block(
          ruleName,
          Array.from(propertiesToCSSRules(value.properties))
        );
      else if (ts.isArrayLiteralExpression(value))
        yield* arrayToResponsiveCSS(ruleName, value);
      else throw new Error(`Unsupported value expression`);
  } catch (e) {
    yield new css.Comment(
      `Unable to transform \`${property.getFullText()}\`: ${
        (e as Error).message
      }`
    );
  }
}

function propertiesToCSSRules(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike>
) {
  return properties.flatMap((property) =>
    Array.from(propertyToCSSRules(property))
  );
}

function mergeLikeBlocks(expressions: css.Expression[]): css.Expression[] {
  const nonBlocks: (css.Rule | css.Comment)[] = [];
  const mergedBlocksByName = new Map<string, css.Expression[]>();

  for (const expression of expressions)
    if (expression instanceof css.Block)
      mergedBlocksByName.set(
        expression.name,
        (mergedBlocksByName.get(expression.name) ?? []).concat(
          expression.expressions
        )
      );
    else nonBlocks.push(expression);

  const blocks: css.Block[] = Array.from(mergedBlocksByName.entries()).map(
    ([name, exps]) => new css.Block(name, mergeLikeBlocks(exps))
  );

  return [...nonBlocks, ...blocks];
}

export function convert(input: string) {
  // auto wrap in braces if the user pasted part of an object
  const trimmed = input.trim();
  const hasBraces = trimmed.startsWith("{") || trimmed.endsWith("}");

  const inputTs = `const _ = ${hasBraces ? input : `{${input}}`}`;

  const sourceFile = new tsUtils.ChildWalker(
    ts.createSourceFile("input.ts", inputTs, ts.ScriptTarget.ESNext, true)
  );

  sourceFile.debug();

  const objectExpression =
    sourceFile.children[0]?.children[0]?.children[0]?.children[1]?.sourceNode;

  if (!objectExpression || !ts.isObjectLiteralExpression(objectExpression)) {
    throw new Error("Error: Input must be an object");
  }

  return mergeLikeBlocks(propertiesToCSSRules(objectExpression.properties));
}

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
  "3": "--borderRadius-full",
};

function replaceShorthands(
  value: string,
  variables: Partial<Record<string, string>>
) {
  let result = value;
  // yeah this is horribly inefficient I know
  for (const [shorthand, variable] of Object.entries(variables))
    result = result.replaceAll(
      RegExp(`(?<=\\s|^)${shorthand}(?=\\s|$)`, "g"),
      `var(${variable})`
    );

  return result;
}

export function expandValueShorthands(name: string, value: string) {
  // always replace colors
  let result = replaceShorthands(value, colorVariables);

  if (name.startsWith("padding") || name.startsWith("margin"))
    result = replaceShorthands(result, spacingVariables);
  else if (name === "gap") result = replaceShorthands(result, gapVariables);
  else if (name === "font-size")
    result = replaceShorthands(result, fontSizeVariables);
  else if (name === "font-family")
    result = replaceShorthands(result, fontFamilyVariables);
  else if (name.startsWith("border-radius"))
    result = replaceShorthands(result, borderRadiusVariables);
  else if (name.startsWith("border"))
    result = replaceShorthands(result, borderVariables);

  // if just a number that doesn't match a shorthand, fall back to px
  if (result.match(/^\d+$/) && result !== "0") result = `${result}px`;

  return result;
}

export function buildCssModuleFileName(componentFileName: string) {
  const parts = componentFileName.split(".");
  parts.pop(); // delete file extension
  parts.push("module", "css");
  return parts.join(".");
}

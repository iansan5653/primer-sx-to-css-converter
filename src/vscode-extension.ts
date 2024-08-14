import * as vscode from "vscode";

import {convert} from "./convert";
import {buildCssModuleFileName} from "./css-modules";

const convertCurrentSelection = () => {
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;

  if (!selection || selection.isEmpty)
    throw new Error("No text selected to convert");

  const input = editor.document.getText(
    new vscode.Range(selection.start, selection.end)
  );

  return convert(input);
};

const convertAndCopyToClipboard = async () => {
  const properties = convertCurrentSelection();
  const css = properties.join("\n");
  await vscode.env.clipboard.writeText(css);
  vscode.window.showInformationMessage("Copied CSS to clipboard");
};

const convertAndMoveToModule = async () => {
  const properties = convertCurrentSelection();

  const editor = vscode.window.activeTextEditor;

  const sourceFilePath = editor?.document.fileName ?? "";
  if (!sourceFilePath)
    throw new Error("Cannot locate module file without an origin document");

  const targetFileUri = vscode.Uri.file(buildCssModuleFileName(sourceFilePath));

  let insertionPosition: vscode.Position;
  let prependNewlineCount: number;
  try {
    const document = await vscode.workspace.openTextDocument(targetFileUri);
    const lastLineRange = document.lineAt(document.lineCount - 1).range;
    insertionPosition = lastLineRange.end;
    prependNewlineCount = document.getText().endsWith("\n") ? 1 : 2;
  } catch (e) {
    const edit = new vscode.WorkspaceEdit();
    prependNewlineCount = 0;
    edit.createFile(targetFileUri, {ignoreIfExists: true});
    insertionPosition = new vscode.Position(0, 0);
    await vscode.workspace.applyEdit(edit);
  }

  const snippet = new vscode.SnippetString(`\${1:${"\n".repeat(
    prependNewlineCount
  )}.\${2:className} {
  ${properties.join("\n  ").replaceAll("\\", "\\\\").replaceAll("}", "\\}")}
\\}
}`);

  const document = await vscode.workspace.openTextDocument(targetFileUri);
  const newEditor = await vscode.window.showTextDocument(document);

  newEditor.insertSnippet(snippet, insertionPosition);
};

export function activate(context: vscode.ExtensionContext) {
  const clipboardCommand = "sxToCss.convertSxToClipboard";
  const moduleCommand = "sxToCss.convertSxToModule";

  context.subscriptions.push(
    vscode.commands.registerCommand(
      clipboardCommand,
      convertAndCopyToClipboard
    ),
    vscode.commands.registerCommand(moduleCommand, convertAndMoveToModule)
  );
}

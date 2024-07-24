import * as vscode from "vscode";
import * as path from "path";

import {convert} from "./convert";

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
  const css = Array.from(properties).join("\n");
  await vscode.env.clipboard.writeText(css);
  vscode.window.showInformationMessage("Copied CSS to clipboard");
};

const convertAndMoveToModule = async () => {
  const properties = convertCurrentSelection();

  const editor = vscode.window.activeTextEditor;

  const sourceFilePath = editor?.document.fileName
    ? path.parse(editor?.document.fileName)
    : undefined;
  if (!sourceFilePath)
    throw new Error("Cannot locate module file without an origin document");

  const targetFileUri = vscode.Uri.file(
    `${sourceFilePath.dir}/${sourceFilePath.name}.module.css`
  );

  const edit = new vscode.WorkspaceEdit();

  let insertionPosition: vscode.Position;
  let prependNewlineCount: number;
  try {
    const document = await vscode.workspace.openTextDocument(targetFileUri);
    const lastLineRange = document.lineAt(document.lineCount - 1).range;
    insertionPosition = lastLineRange.end;
    prependNewlineCount = document.getText().endsWith("\n") ? 1 : 2;
  } catch (e) {
    prependNewlineCount = 0;
    edit.createFile(targetFileUri, {ignoreIfExists: true});
    insertionPosition = new vscode.Position(0, 0);
  }

  const css = `${"\n".repeat(prependNewlineCount)}.className {
  ${Array.from(properties).join("\n  ")}
}
`;

  edit.insert(targetFileUri, insertionPosition, css);

  await vscode.workspace.applyEdit(edit);

  const document = await vscode.workspace.openTextDocument(targetFileUri);
  const endOfDocumentPosition = document.lineAt(document.lineCount - 1).range
    .end;

  const newEditor = await vscode.window.showTextDocument(document);

  const newSelection = new vscode.Selection(
    insertionPosition,
    endOfDocumentPosition
  );
  newEditor.selection = newSelection;
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

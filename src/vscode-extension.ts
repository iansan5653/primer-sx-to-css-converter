import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const command = "sxToCss.convertSx";

  const commandHandler = () => {
    vscode.window.showInformationMessage("hello world");
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(command, commandHandler)
  );
}

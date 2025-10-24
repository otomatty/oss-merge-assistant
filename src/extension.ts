/**
 * OSS Merge Assistant Extension
 *
 * DEPENDENCY MAP:
 *
 * Dependencies (このファイルが使用している外部ファイル):
 *   ├─ vscode
 *   ├─ src/providers/ossTreeProvider.ts
 *   ├─ src/webview/settingsWebview.ts
 *   ├─ src/services/configService.ts
 *   └─ src/services/gitService.ts
 *
 * Related Documentation:
 *   ├─ Spec: docs/requirement.md
 *   └─ Plan: MVP Phase 1 - Main Extension
 */

import * as vscode from "vscode";
import * as path from "path";
import { OSSTreeProvider } from "./providers/ossTreeProvider";
import { SettingsWebview } from "./webview/settingsWebview";
import { ConfigService } from "./services/configService";
import { GitService } from "./services/gitService";

let treeProvider: OSSTreeProvider | undefined;
let settingsWebview: SettingsWebview | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("OSS Merge Assistant is now active!");

  // Get workspace root
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      "OSS Merge Assistant requires an open workspace"
    );
    return;
  }

  // Initialize services
  const configService = ConfigService.getInstance(workspaceRoot);
  const gitService = GitService.getInstance(workspaceRoot);

  // Initialize tree provider
  treeProvider = new OSSTreeProvider(workspaceRoot);
  vscode.window.registerTreeDataProvider("ossAssistantView", treeProvider);

  // Initialize settings webview
  settingsWebview = new SettingsWebview(context, workspaceRoot);

  // Register commands
  registerCommands(context, treeProvider, settingsWebview, gitService);

  // Check if git repository and show initial message
  checkInitialSetup(gitService, configService);
}

function getWorkspaceRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }
  return workspaceFolders[0].uri.fsPath;
}

function registerCommands(
  context: vscode.ExtensionContext,
  treeProvider: OSSTreeProvider,
  settingsWebview: SettingsWebview,
  gitService: GitService
): void {
  // Legacy command (keep for compatibility)
  const helloWorldDisposable = vscode.commands.registerCommand(
    "oss-merge-assitant.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from OSS Merge Assistant!"
      );
    }
  );

  // Open settings webview
  const openSettingsDisposable = vscode.commands.registerCommand(
    "oss-merge-assistant.openSettings",
    async () => {
      await settingsWebview.show();
    }
  );

  // Check for updates
  const checkUpdatesDisposable = vscode.commands.registerCommand(
    "oss-merge-assistant.checkUpdates",
    async () => {
      await treeProvider.updateStatus();
    }
  );

  // Refresh tree view
  const refreshDisposable = vscode.commands.registerCommand(
    "oss-merge-assistant.refresh",
    () => {
      treeProvider.refresh();
    }
  );

  // Open file command
  const openFileDisposable = vscode.commands.registerCommand(
    "oss-merge-assistant.openFile",
    async (filePath: string) => {
      await gitService.openFile(filePath);
    }
  );

  // Force reload command
  const reloadDisposable = vscode.commands.registerCommand(
    "oss-merge-assistant.reload",
    async () => {
      await treeProvider.reload();
      vscode.window.showInformationMessage("OSS Merge Assistant reloaded");
    }
  );

  // Add all disposables to context
  context.subscriptions.push(
    helloWorldDisposable,
    openSettingsDisposable,
    checkUpdatesDisposable,
    refreshDisposable,
    openFileDisposable,
    reloadDisposable
  );
}

async function checkInitialSetup(
  gitService: GitService,
  configService: ConfigService
): Promise<void> {
  try {
    // Check if current workspace is a git repository
    const isGitRepo = await gitService.isGitRepository();
    if (!isGitRepo) {
      vscode.window
        .showWarningMessage(
          "Current workspace is not a Git repository. OSS Merge Assistant requires a Git repository to function.",
          "Learn More"
        )
        .then((selection) => {
          if (selection === "Learn More") {
            vscode.env.openExternal(
              vscode.Uri.parse("https://git-scm.com/docs/git-init")
            );
          }
        });
      return;
    }

    // Check if configuration exists
    const isConfigured = await configService.isConfigured();
    if (!isConfigured) {
      const result = await vscode.window.showInformationMessage(
        "Welcome to OSS Merge Assistant! Let's configure your upstream repository.",
        "Open Settings",
        "Later"
      );

      if (result === "Open Settings") {
        vscode.commands.executeCommand("oss-merge-assistant.openSettings");
      }
    }
  } catch (error) {
    console.error("Failed to check initial setup:", error);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("OSS Merge Assistant is being deactivated");

  // Clean up resources
  treeProvider = undefined;
  settingsWebview = undefined;
}

/**
 * OSS Tree Provider
 *
 * DEPENDENCY MAP:
 *
 * Parents (このファイルを使用している場所):
 *   └─ src/extension.ts
 *
 * Dependencies (このファイルが使用している外部ファイル):
 *   ├─ vscode
 *   ├─ src/services/configService.ts
 *   ├─ src/services/gitService.ts
 *   └─ src/types/index.ts
 *
 * Related Documentation:
 *   ├─ Spec: docs/requirement.md
 *   └─ Plan: MVP Phase 1 - Sidebar TreeView
 */

import * as vscode from "vscode";
import { ConfigService } from "../services/configService";
import { GitService } from "../services/gitService";
import { TreeItemData, GitStatus, ModifiedFile, OSSConfig } from "../types";

export class OSSTreeProvider implements vscode.TreeDataProvider<TreeItemData> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItemData | undefined | null | void
  > = new vscode.EventEmitter<TreeItemData | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TreeItemData | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private configService: ConfigService;
  private gitService: GitService;
  private config: OSSConfig | null = null;
  private gitStatus: GitStatus | null = null;
  private modifiedFiles: ModifiedFile[] = [];

  constructor(private workspaceRoot: string) {
    this.configService = ConfigService.getInstance(workspaceRoot);
    this.gitService = GitService.getInstance(workspaceRoot);
    this.loadData();
  }

  /**
   * Load configuration and git status
   */
  private async loadData(): Promise<void> {
    try {
      this.config = await this.configService.loadConfig();

      if (this.config && (await this.gitService.isGitRepository())) {
        // Ensure upstream remote is configured
        await this.gitService.addUpstreamRemote(this.config.upstreamUrl);

        // Get git status
        this.gitStatus = await this.gitService.getGitStatus(
          this.config.targetBranch
        );

        // Get modified files
        this.modifiedFiles = await this.gitService.getModifiedFiles(
          this.config.targetBranch
        );
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }

    this.refresh();
  }

  /**
   * Refresh tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Reload data and refresh
   */
  async reload(): Promise<void> {
    await this.loadData();
  }

  getTreeItem(element: TreeItemData): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label);

    item.description = element.description;
    item.collapsibleState =
      element.collapsibleState || vscode.TreeItemCollapsibleState.None;

    if (element.command) {
      item.command = element.command;
    }

    // Set context value for different item types
    item.contextValue = element.type;

    // Set icons
    this.setItemIcon(item, element);

    return item;
  }

  private setItemIcon(item: vscode.TreeItem, element: TreeItemData): void {
    switch (element.type) {
      case "status":
        item.iconPath = new vscode.ThemeIcon("pulse");
        break;
      case "actions":
        item.iconPath = new vscode.ThemeIcon("gear");
        break;
      case "modified-files":
        item.iconPath = new vscode.ThemeIcon("folder");
        break;
      case "file":
        const fileIcon = this.getFileIcon(element.filePath || "");
        item.iconPath = new vscode.ThemeIcon(fileIcon);
        break;
    }
  }

  private getFileIcon(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";

    switch (ext) {
      case "ts":
      case "tsx":
        return "file-code";
      case "js":
      case "jsx":
        return "file-code";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "css":
      case "scss":
      case "less":
        return "file-code";
      case "html":
        return "file-code";
      default:
        return "file";
    }
  }

  getChildren(element?: TreeItemData): Thenable<TreeItemData[]> {
    if (!element) {
      // Root level items
      return Promise.resolve(this.getRootItems());
    }

    // Child items
    switch (element.type) {
      case "modified-files":
        return Promise.resolve(this.getModifiedFileItems());
      default:
        return Promise.resolve([]);
    }
  }

  private getRootItems(): TreeItemData[] {
    const items: TreeItemData[] = [];

    // Status section
    items.push(this.getStatusItem());

    // Actions section
    items.push({
      type: "actions",
      label: "🔄 Actions",
      collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      description: "Quick actions",
    });

    // Check Updates action
    items.push({
      type: "actions",
      label: "Check Updates",
      description: "Fetch from upstream",
      command: {
        command: "oss-merge-assistant.checkUpdates",
        title: "Check Updates",
      },
    });

    // Open Settings action
    items.push({
      type: "actions",
      label: "Open Settings",
      description: "Configure repository",
      command: {
        command: "oss-merge-assistant.openSettings",
        title: "Open Settings",
      },
    });

    // Modified Files section (if there are any)
    if (this.modifiedFiles.length > 0) {
      items.push({
        type: "modified-files",
        label: `📁 Modified Files (${this.modifiedFiles.length})`,
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        description: "Files differing from upstream",
      });
    }

    return items;
  }

  private getStatusItem(): TreeItemData {
    if (!this.config) {
      return {
        type: "status",
        label: "⚠️ Not Configured",
        description: "Click to setup",
      };
    }

    if (!this.gitStatus) {
      return {
        type: "status",
        label: "📊 Project Status",
        description: "Loading...",
      };
    }

    const behindText =
      this.gitStatus.behindCount > 0
        ? `↑ ${this.gitStatus.behindCount} commits behind`
        : "✅ Up to date";

    return {
      type: "status",
      label: "📊 Project Status",
      description: behindText,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
    };
  }

  private getModifiedFileItems(): TreeItemData[] {
    return this.modifiedFiles.map((file) => ({
      type: "file" as const,
      label: file.path,
      description: this.getFileStatusDescription(file.status),
      filePath: file.path,
      command: {
        command: "oss-merge-assistant.openFile",
        title: "Open File",
        arguments: [file.path],
      },
    }));
  }

  private getFileStatusDescription(status: ModifiedFile["status"]): string {
    switch (status) {
      case "added":
        return "(Added)";
      case "deleted":
        return "(Deleted)";
      case "modified":
        return "(Modified)";
      case "renamed":
        return "(Renamed)";
      default:
        return "";
    }
  }

  /**
   * Update git status manually
   */
  async updateStatus(): Promise<void> {
    if (!this.config) {
      vscode.window.showWarningMessage(
        "Please configure OSS Merge Assistant first"
      );
      return;
    }

    try {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Checking upstream updates...",
          cancellable: false,
        },
        async () => {
          // Fetch from upstream
          await this.gitService.fetchUpstream();

          // Update status
          this.gitStatus = await this.gitService.getGitStatus(
            this.config!.targetBranch
          );
          this.modifiedFiles = await this.gitService.getModifiedFiles(
            this.config!.targetBranch
          );

          this.refresh();
        }
      );

      vscode.window.showInformationMessage("Status updated successfully");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update status: ${error}`);
    }
  }
}

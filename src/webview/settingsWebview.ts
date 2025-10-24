/**
 * Settings Webview
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
 *   ├─ src/providers/ossTreeProvider.ts
 *   └─ src/types/index.ts
 *
 * Related Documentation:
 *   ├─ Spec: docs/requirement.md
 *   └─ Plan: MVP Phase 1 - Settings Webview
 */

import * as vscode from "vscode";
import { ConfigService } from "../services/configService";
import { GitService } from "../services/gitService";
import { OSSConfig } from "../types";
import { OSSTreeProvider } from "../providers/ossTreeProvider";

export class SettingsWebview {
  private panel: vscode.WebviewPanel | undefined;
  private configService: ConfigService;
  private gitService: GitService;

  constructor(
    private context: vscode.ExtensionContext,
    private workspaceRoot: string,
    private treeProvider: OSSTreeProvider
  ) {
    this.configService = ConfigService.getInstance(workspaceRoot);
    this.gitService = GitService.getInstance(workspaceRoot);
  }

  /**
   * Show settings webview
   */
  async show(): Promise<void> {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "ossAssistantSettings",
      "OSS Merge Assistant Settings",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    // Load current configuration
    const currentConfig = await this.configService.loadConfig();

    // Auto-detect Git configuration
    const autoDetected = await this.gitService.autoDetectConfig();

    // Set webview content
    this.panel.webview.html = this.getWebviewContent(
      currentConfig,
      autoDetected
    );

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this.handleWebviewMessage(message);
      },
      undefined,
      this.context.subscriptions
    );
  }

  private getWebviewContent(
    config: OSSConfig | null,
    autoDetected: {
      upstreamUrl: string | null;
      targetBranch: string;
      localBaseBranch: string;
      remotes: { name: string; url: string }[];
      upstreamBranches: string[];
      localBranches: string[];
    }
  ): string {
    const currentConfig = config || this.configService.getDefaultConfig();

    // Use auto-detected values if config is empty
    const upstreamUrl =
      currentConfig.upstreamUrl || autoDetected.upstreamUrl || "";
    const targetBranch =
      currentConfig.targetBranch || autoDetected.targetBranch;
    const localBaseBranch =
      currentConfig.localBaseBranch || autoDetected.localBaseBranch;

    const hasAutoDetected = autoDetected.upstreamUrl !== null;
    const remotesInfo =
      autoDetected.remotes.length > 0
        ? autoDetected.remotes.map((r) => `${r.name}: ${r.url}`).join("<br>")
        : "No remotes found";

    // Build branch options - use detected branches if available, otherwise use defaults
    const upstreamBranchOptions =
      autoDetected.upstreamBranches.length > 0
        ? autoDetected.upstreamBranches
        : ["main", "master", "develop", "dev"];

    const localBranchOptions =
      autoDetected.localBranches.length > 0
        ? autoDetected.localBranches
        : ["main", "master", "develop", "dev"];

    const buildBranchOptions = (branches: string[], selectedBranch: string) => {
      return branches
        .map(
          (branch) =>
            `<option value="${branch}" ${
              branch === selectedBranch ? "selected" : ""
            }>${branch}</option>`
        )
        .join("\n");
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSS Merge Assistant Settings</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .section {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .section h2 {
            margin-top: 0;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-input-border);
            padding-bottom: 10px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: var(--vscode-font-size);
        }
        input:focus, select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-size: var(--vscode-font-size);
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .status {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            display: none;
        }
        .status.success {
            background-color: var(--vscode-notificationsInfoIcon-foreground);
            color: white;
        }
        .status.error {
            background-color: var(--vscode-notificationsErrorIcon-foreground);
            color: white;
        }
        .help-text {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        .loading {
            display: none;
            color: var(--vscode-descriptionForeground);
        }
        .info-box {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 12px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .info-box.success {
            border-left-color: var(--vscode-notificationsInfoIcon-foreground);
        }
        .info-box-title {
            font-weight: bold;
            margin-bottom: 8px;
        }
        .remotes-list {
            font-size: 0.9em;
            margin-top: 5px;
            padding-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OSS Merge Assistant Settings</h1>
        
        <div id="status" class="status"></div>
        
        ${
          hasAutoDetected
            ? `
        <div class="info-box success">
            <div class="info-box-title">✅ Auto-detected Configuration</div>
            <div>Found upstream remote: <code>${autoDetected.upstreamUrl}</code></div>
            <div class="help-text">The settings below have been automatically filled from your Git configuration.</div>
        </div>
        `
            : autoDetected.remotes.length > 0
            ? `
        <div class="info-box">
            <div class="info-box-title">ℹ️ Git Remotes Detected</div>
            <div class="remotes-list">${remotesInfo}</div>
            <div class="help-text">No 'upstream' remote found. Please configure manually or add an upstream remote.</div>
        </div>
        `
            : `
        <div class="info-box">
            <div class="info-box-title">ℹ️ No Git Remotes</div>
            <div class="help-text">Please configure your upstream repository manually.</div>
        </div>
        `
        }

        <div class="section">
            <h2>Repository Configuration</h2>
            
            <div class="form-group">
                <label for="upstreamUrl">Upstream Repository URL:</label>
                <input type="url" id="upstreamUrl" value="${upstreamUrl}" 
                       placeholder="https://github.com/original/repo.git">
                <div class="help-text">
                    The URL of the original OSS repository you want to track. 
                    Supports HTTPS, SSH, and Git protocols.
                </div>
            </div>

                        <div class="form-group">
                <label for="targetBranch">Target Branch:</label>
                <select id="targetBranch">
                    ${buildBranchOptions(upstreamBranchOptions, targetBranch)}
                </select>
                <div class="help-text">
                    The branch in the upstream repository to track for updates.
                    ${
                      autoDetected.upstreamBranches.length > 0
                        ? `(${autoDetected.upstreamBranches.length} branches detected from upstream)`
                        : ""
                    }
                </div>
            </div>

            <div class="form-group">
                <label for="localBaseBranch">Local Base Branch:</label>
                <select id="localBaseBranch">
                    ${buildBranchOptions(localBranchOptions, localBaseBranch)}
                </select>
                <div class="help-text">
                    Your local development base branch for customizations.
                    ${
                      autoDetected.localBranches.length > 0
                        ? `(${autoDetected.localBranches.length} local branches detected)`
                        : ""
                    }
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Actions</h2>
            <button class="button" onclick="testConnection()">
                <span id="test-text">Test Connection</span>
                <span id="test-loading" class="loading">Testing...</span>
            </button>
            <button class="button" onclick="saveSettings()">
                <span id="save-text">Save Settings</span>
                <span id="save-loading" class="loading">Saving...</span>
            </button>
            <button class="button secondary" onclick="resetToDefault()">Reset to Default</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }

        function getFormData() {
            return {
                upstreamUrl: document.getElementById('upstreamUrl').value.trim(),
                targetBranch: document.getElementById('targetBranch').value,
                localBaseBranch: document.getElementById('localBaseBranch').value
            };
        }

        function testConnection() {
            const config = getFormData();
            
            if (!config.upstreamUrl) {
                showStatus('Please enter an upstream repository URL', 'error');
                return;
            }

            // Show loading state
            document.getElementById('test-text').style.display = 'none';
            document.getElementById('test-loading').style.display = 'inline';

            vscode.postMessage({
                command: 'testConnection',
                config: config
            });
        }

        function saveSettings() {
            const config = getFormData();
            
            if (!config.upstreamUrl) {
                showStatus('Please enter an upstream repository URL', 'error');
                return;
            }

            // Show loading state
            document.getElementById('save-text').style.display = 'none';
            document.getElementById('save-loading').style.display = 'inline';

            vscode.postMessage({
                command: 'saveConfig',
                config: config
            });
        }

        function resetToDefault() {
            document.getElementById('upstreamUrl').value = '';
            document.getElementById('targetBranch').value = 'main';
            document.getElementById('localBaseBranch').value = 'main';
            showStatus('Form reset to default values', 'success');
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            // Hide loading states
            document.getElementById('test-text').style.display = 'inline';
            document.getElementById('test-loading').style.display = 'none';
            document.getElementById('save-text').style.display = 'inline';
            document.getElementById('save-loading').style.display = 'none';

            switch (message.command) {
                case 'testResult':
                    if (message.success) {
                        showStatus('✅ Connection successful!', 'success');
                    } else {
                        showStatus('❌ Connection failed: ' + message.error, 'error');
                    }
                    break;
                case 'saveResult':
                    if (message.success) {
                        showStatus('✅ Settings saved successfully!', 'success');
                    } else {
                        showStatus('❌ Failed to save settings: ' + message.error, 'error');
                    }
                    break;
            }
        });
    </script>
</body>
</html>`;
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.command) {
      case "testConnection":
        await this.testConnection(message.config);
        break;
      case "saveConfig":
        await this.saveConfig(message.config);
        break;
    }
  }

  private async testConnection(config: OSSConfig): Promise<void> {
    try {
      const result = await this.gitService.testUpstreamConnection(
        config.upstreamUrl
      );

      this.panel?.webview.postMessage({
        command: "testResult",
        success: result.success,
        error: result.error,
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        command: "testResult",
        success: false,
        error: String(error),
      });
    }
  }

  private async saveConfig(config: OSSConfig): Promise<void> {
    try {
      const validation = this.configService.validateConfig(config);

      if (!validation.isValid) {
        this.panel?.webview.postMessage({
          command: "saveResult",
          success: false,
          error: validation.errors.join(", "),
        });
        return;
      }

      await this.configService.saveConfig(config);

      // Reload TreeProvider to update the view with new configuration
      await this.treeProvider.reload();

      this.panel?.webview.postMessage({
        command: "saveResult",
        success: true,
      });

      // Notify extension to refresh tree view (legacy command)
      vscode.commands.executeCommand("oss-merge-assistant.refresh");
    } catch (error) {
      this.panel?.webview.postMessage({
        command: "saveResult",
        success: false,
        error: String(error),
      });
    }
  }
}

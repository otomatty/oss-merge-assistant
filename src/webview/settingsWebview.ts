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
        
        /* Tab styles */
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-input-border);
            margin-bottom: 20px;
        }
        .tab {
            padding: 10px 20px;
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            font-size: var(--vscode-font-size);
        }
        .tab:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .tab.active {
            border-bottom-color: var(--vscode-focusBorder);
            font-weight: bold;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        
        /* Version Range specific styles */
        .range-option {
            margin-bottom: 15px;
            padding: 15px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .range-option input[type="radio"] {
            width: auto;
            margin-right: 8px;
        }
        .range-inputs {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            margin-left: 25px;
        }
        .range-inputs > div {
            flex: 1;
        }
        .preview-box {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        
        /* Exclusion specific styles */
        .pattern-list {
            margin-top: 10px;
        }
        .pattern-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background-color: var(--vscode-list-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .pattern-item input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
        }
        .pattern-item label {
            flex: 1;
            margin: 0;
            font-weight: normal;
        }
        .pattern-item button {
            width: auto;
            padding: 4px 8px;
            margin-left: 5px;
        }
        .test-result {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            background-color: var(--vscode-textBlockQuote-background);
        }
        .add-pattern-section {
            margin-top: 15px;
            padding: 15px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OSS Merge Assistant Settings</h1>
        
        <div id="status" class="status"></div>
        
        <!-- Tab Navigation -->
        <div class="tabs">
            <button class="tab active" data-tab="basic">Basic Settings</button>
            <button class="tab" data-tab="version">Version Range</button>
            <button class="tab" data-tab="exclusions">Exclusions</button>
        </div>
        
        <!-- Basic Settings Tab -->
        <div class="tab-content active" id="basic-tab">
        
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
        
        </div> <!-- End Basic Settings Tab -->
        
        <!-- Version Range Tab -->
        <div class="tab-content" id="version-tab">
            <div class="section">
                <h2>Version Range Configuration</h2>
                <div class="help-text" style="margin-bottom: 15px;">
                    Specify a version range to compare specific releases or commits instead of the entire branch.
                </div>
                
                <div class="range-option">
                    <label>
                        <input type="radio" name="rangeMode" value="branch" checked onchange="updateRangeMode('branch')">
                        Compare with branch (default)
                    </label>
                    <div class="help-text">Compare your local branch with the latest upstream branch.</div>
                </div>
                
                <div class="range-option">
                    <label>
                        <input type="radio" name="rangeMode" value="range" onchange="updateRangeMode('range')">
                        Compare specific version range
                    </label>
                    <div class="range-inputs" id="range-inputs" style="display: none;">
                        <div class="form-group">
                            <label for="rangeFrom">From:</label>
                            <select id="rangeFrom" onchange="onRangeChange()">
                                <option value="">-- Select version or tag --</option>
                            </select>
                            <div class="help-text" id="from-loading" style="display: none;">
                                🔄 Loading tags...
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="rangeTo">To:</label>
                            <select id="rangeTo" onchange="onRangeChange()">
                                <option value="">-- Select version or tag --</option>
                            </select>
                            <div class="help-text" id="to-loading" style="display: none;">
                                🔄 Loading tags...
                            </div>
                        </div>
                        <div class="form-group">
                            <button class="button secondary" onclick="refreshTags()" style="width: auto;">
                                🔄 Refresh Tags
                            </button>
                        </div>
                    </div>
                    <div class="preview-box" id="range-preview" style="display: none;">
                        📊 <span id="preview-text">Preview: Comparing X commits</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <button class="button" onclick="applyVersionRange()">Apply Range</button>
                    <button class="button secondary" onclick="resetVersionRange()">Reset to Default</button>
                </div>
            </div>
        </div>
        
        <!-- Exclusions Tab -->
        <div class="tab-content" id="exclusions-tab">
            <div class="section">
                <h2>File Exclusion Settings</h2>
                <div class="help-text" style="margin-bottom: 15px;">
                    Exclude specific files or directories from difference checking using glob patterns.
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="exclusionsEnabled" checked onchange="toggleExclusions()">
                        Enable file exclusions
                    </label>
                </div>
                
                <div id="exclusions-config">
                    <h3>Preset Patterns</h3>
                    <div class="pattern-list" id="preset-patterns">
                        ${this.configService
                          .getDefaultExclusions()
                          .patterns.map(
                            (pattern) => `
                        <div class="pattern-item">
                            <input type="checkbox" id="preset-${pattern.replace(
                              /[^a-zA-Z0-9]/g,
                              "_"
                            )}" checked>
                            <label for="preset-${pattern.replace(
                              /[^a-zA-Z0-9]/g,
                              "_"
                            )}">${pattern}</label>
                        </div>
                        `
                          )
                          .join("")}
                    </div>
                    
                    <h3 style="margin-top: 20px;">Custom Patterns</h3>
                    <div class="add-pattern-section">
                        <div class="form-group">
                            <label for="newPattern">Pattern (glob format):</label>
                            <input type="text" id="newPattern" placeholder="e.g., test/**/*.test.ts">
                            <div class="help-text">
                                Examples: <code>*.log</code>, <code>dist/**</code>, <code>src/**/test/*</code>
                            </div>
                        </div>
                        <button class="button" onclick="testPattern()">Test Pattern</button>
                        <button class="button secondary" onclick="addCustomPattern()">Add Pattern</button>
                    </div>
                    
                    <div id="test-result" class="test-result" style="display: none;">
                        <div id="test-result-text"></div>
                    </div>
                    
                    <div class="pattern-list" id="custom-patterns">
                        <!-- Custom patterns will be added here dynamically -->
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <button class="button" onclick="saveExclusions()">Save Exclusions</button>
                    <button class="button secondary" onclick="resetExclusions()">Reset to Defaults</button>
                </div>
            </div>
        </div>

    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                document.getElementById(tabName + '-tab').classList.add('active');
            });
        });

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
            const versionRange = {
                enabled: document.querySelector('input[name="rangeMode"]:checked').value === 'range',
                from: document.getElementById('rangeFrom').value.trim(),
                to: document.getElementById('rangeTo').value.trim(),
                compareMode: document.querySelector('input[name="rangeMode"]:checked').value
            };
            
            const presetPatterns = Array.from(document.querySelectorAll('[id^="preset-"]'))
                .filter(cb => cb.checked)
                .map(cb => cb.nextElementSibling.textContent);
            
            const customPatterns = Array.from(document.querySelectorAll('[id^="custom-"]'))
                .map(cb => cb.nextElementSibling.textContent);
            
            const exclusions = {
                enabled: document.getElementById('exclusionsEnabled').checked,
                patterns: presetPatterns,
                usePresets: true,
                customPatterns: customPatterns
            };
            
            return {
                upstreamUrl: document.getElementById('upstreamUrl').value.trim(),
                targetBranch: document.getElementById('targetBranch').value,
                localBaseBranch: document.getElementById('localBaseBranch').value,
                versionRange: versionRange,
                exclusions: exclusions
            };
        }
        
        // Version Range functions
        function updateRangeMode(mode) {
            const rangeInputs = document.getElementById('range-inputs');
            if (mode === 'range') {
                rangeInputs.style.display = 'flex';
                // Auto-load tags when switching to range mode
                if (!window.tagsLoaded) {
                    loadTags();
                }
            } else {
                rangeInputs.style.display = 'none';
            }
        }
        
        function loadTags() {
            document.getElementById('from-loading').style.display = 'block';
            document.getElementById('to-loading').style.display = 'block';
            vscode.postMessage({ command: 'loadTags' });
        }
        
        function refreshTags() {
            // Clear existing options except the first one
            const fromSelect = document.getElementById('rangeFrom');
            const toSelect = document.getElementById('rangeTo');
            fromSelect.innerHTML = '<option value="">-- Select version or tag --</option>';
            toSelect.innerHTML = '<option value="">-- Select version or tag --</option>';
            
            // Reload tags
            window.tagsLoaded = false;
            loadTags();
        }
        
        function populateTagSelects(tags) {
            const fromSelect = document.getElementById('rangeFrom');
            const toSelect = document.getElementById('rangeTo');
            
            // Save current selections
            const currentFrom = fromSelect.value;
            const currentTo = toSelect.value;
            
            // Clear existing options except the first one
            fromSelect.innerHTML = '<option value="">-- Select version or tag --</option>';
            toSelect.innerHTML = '<option value="">-- Select version or tag --</option>';
            
            // Add tags to both selects
            tags.forEach(tag => {
                const fromOption = document.createElement('option');
                fromOption.value = tag;
                fromOption.textContent = tag;
                fromSelect.appendChild(fromOption);
                
                const toOption = document.createElement('option');
                toOption.value = tag;
                toOption.textContent = tag;
                toSelect.appendChild(toOption);
            });
            
            // Restore selections if they still exist
            if (currentFrom && tags.includes(currentFrom)) {
                fromSelect.value = currentFrom;
            }
            if (currentTo && tags.includes(currentTo)) {
                toSelect.value = currentTo;
            }
            
            // Hide loading indicators
            document.getElementById('from-loading').style.display = 'none';
            document.getElementById('to-loading').style.display = 'none';
            
            window.tagsLoaded = true;
        }
        
        function onRangeChange() {
            const from = document.getElementById('rangeFrom').value;
            const to = document.getElementById('rangeTo').value;
            
            if (from || to) {
                applyVersionRange();
            }
        }
        
        function applyVersionRange() {
            const range = {
                from: document.getElementById('rangeFrom').value,
                to: document.getElementById('rangeTo').value,
                mode: document.querySelector('input[name="rangeMode"]:checked').value
            };
            vscode.postMessage({ command: 'previewVersionRange', range: range });
        }
        
        function resetVersionRange() {
            document.querySelector('input[value="branch"]').checked = true;
            document.getElementById('rangeFrom').value = '';
            document.getElementById('rangeTo').value = '';
            updateRangeMode('branch');
            document.getElementById('range-preview').style.display = 'none';
        }
        
        // Exclusions functions
        function toggleExclusions() {
            const enabled = document.getElementById('exclusionsEnabled').checked;
            document.getElementById('exclusions-config').style.opacity = enabled ? '1' : '0.5';
        }
        
        function testPattern() {
            const pattern = document.getElementById('newPattern').value.trim();
            if (!pattern) {
                showStatus('Please enter a pattern', 'error');
                return;
            }
            vscode.postMessage({ command: 'testExclusionPattern', pattern: pattern });
        }
        
        function addCustomPattern() {
            const pattern = document.getElementById('newPattern').value.trim();
            if (!pattern) {
                showStatus('Please enter a pattern', 'error');
                return;
            }
            
            const customPatterns = document.getElementById('custom-patterns');
            const id = 'custom-' + Date.now();
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.innerHTML = \`
                <input type="checkbox" id="\${id}" checked>
                <label for="\${id}">\${pattern}</label>
                <button class="button secondary" onclick="this.parentElement.remove()">Remove</button>
            \`;
            customPatterns.appendChild(item);
            
            document.getElementById('newPattern').value = '';
            showStatus('Pattern added', 'success');
        }
        
        function saveExclusions() {
            saveSettings();
        }
        
        function resetExclusions() {
            document.querySelectorAll('[id^="preset-"]').forEach(cb => cb.checked = true);
            document.getElementById('custom-patterns').innerHTML = '';
            document.getElementById('exclusionsEnabled').checked = true;
            toggleExclusions();
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
                case 'tagsLoaded':
                    if (message.tags && message.tags.length > 0) {
                        populateTagSelects(message.tags);
                        showStatus(\`📋 Loaded \${message.tags.length} tags\`, 'success');
                    } else if (message.error) {
                        showStatus('❌ Failed to load tags: ' + message.error, 'error');
                        document.getElementById('from-loading').style.display = 'none';
                        document.getElementById('to-loading').style.display = 'none';
                    } else {
                        showStatus('⚠️ No tags found in upstream repository', 'error');
                        document.getElementById('from-loading').style.display = 'none';
                        document.getElementById('to-loading').style.display = 'none';
                    }
                    break;
                case 'patternTestResult':
                    const resultDiv = document.getElementById('test-result');
                    const resultText = document.getElementById('test-result-text');
                    resultDiv.style.display = 'block';
                    if (message.success) {
                        resultText.innerHTML = \`✅ Pattern matches <strong>\${message.matchCount}</strong> files\${message.samples.length > 0 ? '<br>Examples: ' + message.samples.slice(0, 5).join(', ') : ''}\`;
                    } else {
                        resultText.innerHTML = '❌ Error testing pattern: ' + message.error;
                    }
                    break;
                case 'rangePreviewResult':
                    const previewBox = document.getElementById('range-preview');
                    const previewText = document.getElementById('preview-text');
                    previewBox.style.display = 'block';
                    if (message.success) {
                        previewText.textContent = \`Preview: Comparing \${message.commitCount} commits\`;
                    } else {
                        previewText.textContent = 'Error: ' + message.error;
                    }
                    break;
            }
        });
        
        // Initialize version range from config
        const initialConfig = ${JSON.stringify(currentConfig)};
        if (initialConfig.versionRange && initialConfig.versionRange.enabled) {
            // Set range mode
            const rangeRadio = document.querySelector('input[value="range"]');
            if (rangeRadio) {
                rangeRadio.checked = true;
                updateRangeMode('range');
            }
        }
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
      case "loadTags":
        await this.loadUpstreamTags();
        break;
      case "testExclusionPattern":
        await this.testExclusionPattern(message.pattern);
        break;
      case "previewVersionRange":
        await this.previewVersionRange(message.range);
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

  /**
   * Load upstream tags and send to webview
   */
  private async loadUpstreamTags(): Promise<void> {
    try {
      const tags = await this.gitService.getUpstreamTags();

      this.panel?.webview.postMessage({
        command: "tagsLoaded",
        tags,
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        command: "tagsLoaded",
        tags: [],
        error: String(error),
      });
    }
  }

  /**
   * Test exclusion pattern against repository files
   */
  private async testExclusionPattern(pattern: string): Promise<void> {
    try {
      const matchingFiles = await this.gitService.getMatchingFiles([pattern]);

      this.panel?.webview.postMessage({
        command: "patternTestResult",
        success: true,
        matchCount: matchingFiles.length,
        samples: matchingFiles.slice(0, 10), // Show first 10 matches
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        command: "patternTestResult",
        success: false,
        error: String(error),
      });
    }
  }

  /**
   * Preview version range commit count
   */
  private async previewVersionRange(range: {
    from: string;
    to: string;
    mode: "branch" | "tag" | "commit" | "range";
  }): Promise<void> {
    try {
      const config = await this.configService.loadConfig();
      const defaultConfig = this.configService.getDefaultConfig();

      const commits = await this.gitService.getCommitsInRange(
        range.from,
        range.to,
        range.mode,
        config?.targetBranch || defaultConfig.targetBranch,
        config?.localBaseBranch || defaultConfig.localBaseBranch || "main"
      );

      this.panel?.webview.postMessage({
        command: "rangePreviewResult",
        success: true,
        commitCount: commits.length,
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        command: "rangePreviewResult",
        success: false,
        error: String(error),
      });
    }
  }
}

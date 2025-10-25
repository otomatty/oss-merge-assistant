/**
 * Configuration Service
 *
 * DEPENDENCY MAP:
 *
 * Parents (このファイルを使用している場所):
 *   ├─ src/extension.ts
 *   ├─ src/providers/ossTreeProvider.ts
 *   └─ src/webview/settingsWebview.ts
 *
 * Dependencies (このファイルが使用している外部ファイル):
 *   ├─ vscode
 *   ├─ path
 *   ├─ fs/promises
 *   └─ src/types/index.ts
 *
 * Related Documentation:
 *   ├─ Spec: docs/requirement.md
 *   └─ Plan: MVP Phase 1 - Basic Settings
 */

import * as vscode from "vscode";
import * as path from "path";
import { promises as fs } from "fs";
import { OSSConfig, VersionRange, ExclusionConfig } from "../types";

export class ConfigService {
  private static instance: ConfigService;
  private configPath: string;
  private ossAssistDir: string;

  private constructor(private workspaceRoot: string) {
    this.ossAssistDir = path.join(workspaceRoot, ".oss-assist");
    this.configPath = path.join(this.ossAssistDir, "config.json");
  }

  public static getInstance(workspaceRoot?: string): ConfigService {
    if (!ConfigService.instance) {
      if (!workspaceRoot) {
        throw new Error("Workspace root is required for first initialization");
      }
      ConfigService.instance = new ConfigService(workspaceRoot);
    }
    return ConfigService.instance;
  }

  /**
   * Load configuration from config.json file
   */
  async loadConfig(): Promise<OSSConfig | null> {
    try {
      const configData = await fs.readFile(this.configPath, "utf8");
      return JSON.parse(configData) as OSSConfig;
    } catch (error) {
      // Return null if config file doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Save configuration to config.json file
   */
  async saveConfig(config: OSSConfig): Promise<void> {
    try {
      // Ensure .oss-assist directory exists
      await fs.mkdir(this.ossAssistDir, { recursive: true });

      // Add timestamp for last update
      const configWithTimestamp = {
        ...config,
        lastSync: config.lastSync || new Date().toISOString(),
      };

      await fs.writeFile(
        this.configPath,
        JSON.stringify(configWithTimestamp, null, 2),
        "utf8"
      );

      vscode.window.showInformationMessage("Configuration saved successfully");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save configuration: ${error}`);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): OSSConfig {
    return {
      upstreamUrl: "",
      targetBranch: "main",
      localBaseBranch: "main",
      versionRange: this.getDefaultVersionRange(),
      exclusions: this.getDefaultExclusions(),
    };
  }

  /**
   * Get default version range configuration
   */
  getDefaultVersionRange(): VersionRange {
    return {
      enabled: false,
      from: "",
      to: "",
      compareMode: "branch",
    };
  }

  /**
   * Get default exclusion configuration
   */
  getDefaultExclusions(): ExclusionConfig {
    return {
      enabled: true,
      patterns: [
        "node_modules/**",
        "dist/**",
        "build/**",
        ".next/**",
        "out/**",
        "coverage/**",
        "*.log",
        ".env*",
        ".DS_Store",
        "Thumbs.db",
      ],
      usePresets: true,
      customPatterns: [],
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: OSSConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.upstreamUrl || !config.upstreamUrl.trim()) {
      errors.push("Upstream repository URL is required");
    }

    if (!config.targetBranch || !config.targetBranch.trim()) {
      errors.push("Target branch is required");
    }

    // Basic URL validation
    if (config.upstreamUrl) {
      try {
        const url = new URL(config.upstreamUrl);
        if (!["http:", "https:", "git:", "ssh:"].includes(url.protocol)) {
          errors.push("Invalid repository URL protocol");
        }
      } catch {
        // Check if it's a valid SSH format (git@host:user/repo.git)
        const sshPattern = /^git@[^:]+:[^\/]+\/[^\/]+\.git$/;
        if (!sshPattern.test(config.upstreamUrl)) {
          errors.push("Invalid repository URL format");
        }
      }
    }

    // Validate version range if enabled
    if (config.versionRange?.enabled) {
      const rangeValidation = this.validateVersionRange(config.versionRange);
      errors.push(...rangeValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate version range configuration
   */
  validateVersionRange(range: VersionRange): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (range.enabled) {
      if (!range.from && !range.to) {
        errors.push("Version range requires at least one endpoint");
      }
      if (range.compareMode === "range" && (!range.from || !range.to)) {
        errors.push('Range mode requires both "from" and "to" values');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if configuration exists and is valid
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.loadConfig();
    if (!config) {
      return false;
    }

    const validation = this.validateConfig(config);
    return validation.isValid;
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get .oss-assist directory path
   */
  getOSSAssistDir(): string {
    return this.ossAssistDir;
  }
}

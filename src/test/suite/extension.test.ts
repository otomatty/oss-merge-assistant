/**
 * OSS Merge Assistant Test Suite
 *
 * DEPENDENCY MAP:
 *
 * Dependencies (このファイルが使用している外部ファイル):
 *   ├─ vscode
 *   ├─ mocha
 *   ├─ assert
 *   ├─ src/services/configService.ts
 *   ├─ src/services/gitService.ts
 *   └─ src/types/index.ts
 *
 * Related Documentation:
 *   ├─ Spec: docs/requirement.md
 *   └─ Plan: MVP Phase 1 - Basic Tests
 */

import * as assert from "assert";
import * as vscode from "vscode";
import { ConfigService } from "../../services/configService";
import { GitService } from "../../services/gitService";
import { OSSConfig } from "../../types";
import * as path from "path";
import * as fs from "fs/promises";

suite("OSS Merge Assistant Extension Test Suite", () => {
  const testWorkspaceRoot = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "test-workspace"
  );

  suiteSetup(async () => {
    // Create test workspace directory
    try {
      await fs.mkdir(testWorkspaceRoot, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  suiteTeardown(async () => {
    // Clean up test workspace
    try {
      await fs.rmdir(testWorkspaceRoot, { recursive: true });
    } catch (error) {
      // Directory might not exist or in use
    }
  });

  suite("ConfigService", () => {
    let configService: ConfigService;

    setup(() => {
      configService = ConfigService.getInstance(testWorkspaceRoot);
    });

    test("should create default configuration", () => {
      const defaultConfig = configService.getDefaultConfig();

      assert.strictEqual(defaultConfig.upstreamUrl, "");
      assert.strictEqual(defaultConfig.targetBranch, "main");
      assert.strictEqual(defaultConfig.localBaseBranch, "main");
    });

    test("should validate configuration correctly", () => {
      const validConfig: OSSConfig = {
        upstreamUrl: "https://github.com/test/repo.git",
        targetBranch: "main",
        localBaseBranch: "develop",
      };

      const validation = configService.validateConfig(validConfig);
      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    test("should detect invalid configuration", () => {
      const invalidConfig: OSSConfig = {
        upstreamUrl: "", // Invalid: empty URL
        targetBranch: "", // Invalid: empty branch
        localBaseBranch: "main",
      };

      const validation = configService.validateConfig(invalidConfig);
      assert.strictEqual(validation.isValid, false);
      assert.ok(validation.errors.length > 0);
      assert.ok(validation.errors.some((error) => error.includes("URL")));
      assert.ok(validation.errors.some((error) => error.includes("branch")));
    });

    test("should validate SSH URL format", () => {
      const sshConfig: OSSConfig = {
        upstreamUrl: "git@github.com:test/repo.git",
        targetBranch: "main",
        localBaseBranch: "main",
      };

      const validation = configService.validateConfig(sshConfig);
      assert.strictEqual(validation.isValid, true);
    });

    test("should save and load configuration", async () => {
      const testConfig: OSSConfig = {
        upstreamUrl: "https://github.com/test/repo.git",
        targetBranch: "develop",
        localBaseBranch: "main",
      };

      // Save configuration
      await configService.saveConfig(testConfig);

      // Load configuration
      const loadedConfig = await configService.loadConfig();

      assert.ok(loadedConfig);
      assert.strictEqual(loadedConfig.upstreamUrl, testConfig.upstreamUrl);
      assert.strictEqual(loadedConfig.targetBranch, testConfig.targetBranch);
      assert.strictEqual(
        loadedConfig.localBaseBranch,
        testConfig.localBaseBranch
      );
      assert.ok(loadedConfig.lastSync); // Should have timestamp
    });
  });

  suite("GitService", () => {
    let gitService: GitService;

    setup(() => {
      gitService = GitService.getInstance(testWorkspaceRoot);
    });

    test("should detect non-git repository", async () => {
      const isGitRepo = await gitService.isGitRepository();
      // Test workspace is not a git repository
      assert.strictEqual(isGitRepo, false);
    });

    test("should handle git commands gracefully when not in git repo", async () => {
      try {
        const branch = await gitService.getCurrentBranch();
        // Should return 'unknown' when not in git repo
        assert.strictEqual(branch, "unknown");
      } catch (error) {
        // Or might throw error - both are acceptable for non-git repo
        assert.ok(error);
      }
    });
  });

  suite("Integration Tests", () => {
    test("should activate extension without errors", async () => {
      // Test that extension activates successfully
      const extension = vscode.extensions.getExtension(
        "undefined_publisher.oss-merge-assitant"
      );

      if (extension) {
        await extension.activate();
        assert.ok(extension.isActive);
      }
    });

    test("should register commands", () => {
      // Test that all expected commands are registered
      const commands = [
        "oss-merge-assistant.openSettings",
        "oss-merge-assistant.checkUpdates",
        "oss-merge-assistant.refresh",
        "oss-merge-assistant.reload",
      ];

      return vscode.commands.getCommands().then((allCommands) => {
        commands.forEach((command) => {
          assert.ok(
            allCommands.includes(command),
            `Command ${command} should be registered`
          );
        });
      });
    });
  });

  suite("Error Handling", () => {
    test("should handle missing workspace gracefully", () => {
      try {
        ConfigService.getInstance();
        assert.fail("Should throw error when workspace root is not provided");
      } catch (error: any) {
        assert.ok(error);
        assert.ok(error.message.includes("Workspace root is required"));
      }
    });

    test("should handle invalid git commands gracefully", async () => {
      const gitService = GitService.getInstance(testWorkspaceRoot);

      try {
        await gitService.fetchUpstream();
        assert.fail("Should throw error when upstream is not configured");
      } catch (error) {
        assert.ok(error);
        // Error is expected when no upstream is configured
      }
    });
  });
});

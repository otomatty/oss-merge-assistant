/**
 * Git Service
 *
 * DEPENDENCY MAP:
 *
 * Parents (このファイルを使用している場所):
 *   ├─ src/providers/ossTreeProvider.ts
 *   └─ src/extension.ts
 *
 * Dependencies (このファイルが使用している外部ファイル):
 *   ├─ child_process
 *   ├─ vscode
 *   └─ src/types/index.ts
 *
 * Related Documentation:
 *   ├─ Spec: docs/requirement.md
 *   └─ Plan: MVP Phase 1 - Git Operations
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import { GitStatus, UpstreamCommit, ModifiedFile } from "../types";

const execAsync = promisify(exec);

export class GitService {
  private static instance: GitService;

  private constructor(private workspaceRoot: string) {}

  public static getInstance(workspaceRoot?: string): GitService {
    if (!GitService.instance) {
      if (!workspaceRoot) {
        throw new Error("Workspace root is required for first initialization");
      }
      GitService.instance = new GitService(workspaceRoot);
    }
    return GitService.instance;
  }

  /**
   * Execute git command in workspace
   */
  private async execGit(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, {
        cwd: this.workspaceRoot,
        encoding: "utf8",
      });

      if (stderr && !stderr.includes("warning:")) {
        console.warn("Git warning:", stderr);
      }

      return stdout.trim();
    } catch (error: any) {
      console.error("Git command failed:", error);
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  /**
   * Check if current directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.execGit("rev-parse --git-dir");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      return await this.execGit("branch --show-current");
    } catch {
      return "unknown";
    }
  }

  /**
   * Check if working directory is clean
   */
  async isWorkingDirectoryClean(): Promise<boolean> {
    try {
      const output = await this.execGit("status --porcelain");
      return output.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Add upstream remote if not exists
   */
  async addUpstreamRemote(upstreamUrl: string): Promise<void> {
    try {
      // Check if upstream remote already exists
      await this.execGit("remote get-url upstream");

      // If exists, update URL
      await this.execGit(`remote set-url upstream ${upstreamUrl}`);
    } catch {
      // Add new upstream remote
      await this.execGit(`remote add upstream ${upstreamUrl}`);
    }
  }

  /**
   * Fetch from upstream remote
   */
  async fetchUpstream(): Promise<void> {
    await this.execGit("fetch upstream");
  }

  /**
   * Test connection to upstream repository
   */
  async testUpstreamConnection(
    upstreamUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.addUpstreamRemote(upstreamUrl);
      await this.fetchUpstream();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to connect to upstream repository",
      };
    }
  }

  /**
   * Get git status including behind/ahead count
   */
  async getGitStatus(targetBranch: string = "main"): Promise<GitStatus> {
    try {
      const currentBranch = await this.getCurrentBranch();
      const isClean = await this.isWorkingDirectoryClean();

      // Get behind/ahead count
      let behindCount = 0;
      let aheadCount = 0;

      try {
        const revList = await this.execGit(
          `rev-list --left-right --count HEAD...upstream/${targetBranch}`
        );
        const [ahead, behind] = revList.split("\t").map((n) => parseInt(n, 10));
        aheadCount = ahead || 0;
        behindCount = behind || 0;
      } catch (error) {
        console.warn("Could not get behind/ahead count:", error);
      }

      return {
        currentBranch,
        isClean,
        behindCount,
        aheadCount,
      };
    } catch (error) {
      throw new Error(`Failed to get git status: ${error}`);
    }
  }

  /**
   * Get list of commits that are behind upstream
   */
  async getUpstreamCommits(
    targetBranch: string = "main",
    limit: number = 20
  ): Promise<UpstreamCommit[]> {
    try {
      // Get commits that are in upstream but not in current branch
      const logFormat = "--pretty=format:%H|%s|%an|%ai";
      const commits = await this.execGit(
        `log ${logFormat} HEAD..upstream/${targetBranch} -${limit}`
      );

      if (!commits) {
        return [];
      }

      const commitLines = commits.split("\n");
      const result: UpstreamCommit[] = [];

      for (const line of commitLines) {
        const [hash, message, author, date] = line.split("|");
        if (hash && message) {
          // Get files changed in this commit
          const files = await this.getCommitFiles(hash);

          result.push({
            hash,
            message,
            author,
            date,
            files,
          });
        }
      }

      return result;
    } catch (error) {
      console.warn("Could not get upstream commits:", error);
      return [];
    }
  }

  /**
   * Get files changed in a specific commit
   */
  private async getCommitFiles(commitHash: string): Promise<ModifiedFile[]> {
    try {
      const output = await this.execGit(
        `show --name-status --format= ${commitHash}`
      );
      const lines = output.split("\n").filter((line) => line.trim());

      return lines.map((line) => {
        const [status, ...pathParts] = line.split("\t");
        const path = pathParts.join("\t"); // Handle files with tabs in name

        let statusType: ModifiedFile["status"];
        switch (status.charAt(0)) {
          case "A":
            statusType = "added";
            break;
          case "D":
            statusType = "deleted";
            break;
          case "R":
            statusType = "renamed";
            break;
          default:
            statusType = "modified";
            break;
        }

        return {
          path,
          status: statusType,
        };
      });
    } catch (error) {
      console.warn(`Could not get files for commit ${commitHash}:`, error);
      return [];
    }
  }

  /**
   * Get files that differ between current branch and upstream
   */
  async getModifiedFiles(
    targetBranch: string = "main"
  ): Promise<ModifiedFile[]> {
    try {
      const output = await this.execGit(
        `diff --name-status upstream/${targetBranch}...HEAD`
      );

      if (!output) {
        return [];
      }

      const lines = output.split("\n").filter((line) => line.trim());

      return lines.map((line) => {
        const [status, ...pathParts] = line.split("\t");
        const path = pathParts.join("\t");

        let statusType: ModifiedFile["status"];
        switch (status.charAt(0)) {
          case "A":
            statusType = "added";
            break;
          case "D":
            statusType = "deleted";
            break;
          case "R":
            statusType = "renamed";
            break;
          default:
            statusType = "modified";
            break;
        }

        return {
          path,
          status: statusType,
        };
      });
    } catch (error) {
      console.warn("Could not get modified files:", error);
      return [];
    }
  }

  /**
   * Get remote URL for a specific remote name
   */
  async getRemoteUrl(remoteName: string = "upstream"): Promise<string | null> {
    try {
      const url = await this.execGit(`remote get-url ${remoteName}`);
      return url || null;
    } catch {
      return null;
    }
  }

  /**
   * List all remotes with their URLs
   */
  async listRemotes(): Promise<{ name: string; url: string }[]> {
    try {
      const output = await this.execGit("remote -v");
      if (!output) {
        return [];
      }

      const remotes = new Map<string, string>();
      const lines = output.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        const match = line.match(/^(\S+)\s+(\S+)\s+\(fetch\)$/);
        if (match) {
          const [, name, url] = match;
          remotes.set(name, url);
        }
      }

      return Array.from(remotes.entries()).map(([name, url]) => ({
        name,
        url,
      }));
    } catch (error) {
      console.warn("Could not list remotes:", error);
      return [];
    }
  }

  /**
   * Get list of local branches
   */
  async getLocalBranches(): Promise<string[]> {
    try {
      const output = await this.execGit(
        `branch --list --format="%(refname:short)"`
      );

      if (!output) {
        return [];
      }

      const branches = output
        .split("\n")
        .filter((line) => line.trim())
        .map((branch) => branch.trim());

      return branches;
    } catch (error) {
      console.warn("Could not get local branches:", error);
      return [];
    }
  }

  /**
   * Get list of branches from a remote
   */
  async getRemoteBranches(remoteName: string = "upstream"): Promise<string[]> {
    try {
      const output = await this.execGit(
        `branch -r --list "${remoteName}/*" --format="%(refname:short)"`
      );

      if (!output) {
        return [];
      }

      const branches = output
        .split("\n")
        .filter((line) => line.trim())
        .map((branch) => {
          // Remove remote name prefix (e.g., "upstream/main" -> "main")
          return branch.replace(`${remoteName}/`, "");
        })
        .filter((branch) => branch !== "HEAD"); // Exclude HEAD pointer

      return branches;
    } catch (error) {
      console.warn(`Could not get branches from ${remoteName}:`, error);
      return [];
    }
  }

  /**
   * Detect upstream repository URL automatically
   * Priority: upstream > origin
   */
  async detectUpstreamUrl(): Promise<string | null> {
    // First, try to get 'upstream' remote
    const upstreamUrl = await this.getRemoteUrl("upstream");
    if (upstreamUrl) {
      return upstreamUrl;
    }

    // If no upstream, check if origin looks like a fork
    const originUrl = await this.getRemoteUrl("origin");
    if (originUrl) {
      // If this might be a personal fork, we could suggest it
      // but for now, return null to let user configure manually
      return null;
    }

    return null;
  }

  /**
   * Get default branch name from remote
   */
  async getDefaultBranch(remoteName: string = "upstream"): Promise<string> {
    try {
      // Try to get remote HEAD
      const output = await this.execGit(
        `symbolic-ref refs/remotes/${remoteName}/HEAD`
      );
      if (output) {
        // Extract branch name from refs/remotes/upstream/HEAD -> refs/remotes/upstream/main
        const match = output.match(/refs\/remotes\/\w+\/(.+)$/);
        if (match) {
          return match[1];
        }
      }
    } catch {
      // If remote HEAD is not set, try common default branches
    }

    // Fallback: check which common branch exists
    const commonBranches = ["main", "master", "develop", "dev"];
    for (const branch of commonBranches) {
      try {
        await this.execGit(
          `rev-parse --verify refs/remotes/${remoteName}/${branch}`
        );
        return branch;
      } catch {
        continue;
      }
    }

    return "main"; // Ultimate fallback
  }

  /**
   * Auto-detect configuration from Git repository
   */
  async autoDetectConfig(): Promise<{
    upstreamUrl: string | null;
    targetBranch: string;
    localBaseBranch: string;
    remotes: { name: string; url: string }[];
    upstreamBranches: string[];
    localBranches: string[];
  }> {
    const upstreamUrl = await this.detectUpstreamUrl();
    const currentBranch = await this.getCurrentBranch();
    const remotes = await this.listRemotes();
    const localBranches = await this.getLocalBranches();

    let targetBranch = "main";
    let upstreamBranches: string[] = [];

    if (upstreamUrl) {
      targetBranch = await this.getDefaultBranch("upstream");
      upstreamBranches = await this.getRemoteBranches("upstream");
    }

    return {
      upstreamUrl,
      targetBranch,
      localBaseBranch: currentBranch || "main",
      remotes,
      upstreamBranches,
      localBranches,
    };
  }

  /**
   * Open file in VS Code editor
   */
  async openFile(filePath: string): Promise<void> {
    const fullPath = vscode.Uri.file(
      require("path").join(this.workspaceRoot, filePath)
    );
    await vscode.window.showTextDocument(fullPath);
  }
}

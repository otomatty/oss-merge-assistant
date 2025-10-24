/**
 * OSS Merge Assistant - Type Definitions
 *
 * Related Documentation:
 * - Spec: docs/requirement.md
 * - Plan: MVP Phase 1 implementation
 */

/**
 * Configuration interface for OSS tracking
 */
export interface OSSConfig {
  /** Upstream repository URL */
  upstreamUrl: string;
  /** Target branch to track */
  targetBranch: string;
  /** Local base branch for development */
  localBaseBranch?: string;
  /** Last sync timestamp */
  lastSync?: string;
}

/**
 * Git status information
 */
export interface GitStatus {
  /** Number of commits behind upstream */
  behindCount: number;
  /** Number of commits ahead of upstream */
  aheadCount: number;
  /** Current branch name */
  currentBranch: string;
  /** Whether working directory is clean */
  isClean: boolean;
}

/**
 * Modified file information
 */
export interface ModifiedFile {
  /** File path relative to repository root */
  path: string;
  /** Type of modification */
  status: "modified" | "added" | "deleted" | "renamed";
  /** Number of lines added */
  additions?: number;
  /** Number of lines deleted */
  deletions?: number;
}

/**
 * Upstream commit information
 */
export interface UpstreamCommit {
  /** Commit hash */
  hash: string;
  /** Commit message */
  message: string;
  /** Author information */
  author: string;
  /** Commit date */
  date: string;
  /** Modified files in this commit */
  files: ModifiedFile[];
}

/**
 * Tree view item types
 */
export type TreeItemType = "status" | "actions" | "modified-files" | "file";

/**
 * Tree view item data
 */
export interface TreeItemData {
  type: TreeItemType;
  label: string;
  description?: string;
  filePath?: string;
  collapsibleState?: number;
  iconPath?: string;
  command?: {
    command: string;
    title: string;
    arguments?: any[];
  };
}

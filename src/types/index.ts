/**
 * OSS Merge Assistant - Type Definitions
 *
 * Related Documentation:
 * - Spec: docs/requirement.md
 * - Plan: MVP Phase 1 implementation
 */

/**
 * Version range configuration for comparing specific versions
 */
export interface VersionRange {
  /** Whether version range is enabled */
  enabled: boolean;
  /** Starting point (tag, commit, or branch) */
  from: string;
  /** Ending point (tag, commit, or branch) */
  to: string;
  /** Comparison mode */
  compareMode: "branch" | "tag" | "commit" | "range";
}

/**
 * File exclusion configuration
 */
export interface ExclusionConfig {
  /** Whether exclusions are enabled */
  enabled: boolean;
  /** Preset exclusion patterns (node_modules, dist, etc.) */
  patterns: string[];
  /** Whether to use preset patterns */
  usePresets: boolean;
  /** User-defined custom patterns */
  customPatterns: string[];
}

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
  /** Version range configuration for comparing specific versions */
  versionRange?: VersionRange;
  /** File exclusion configuration */
  exclusions?: ExclusionConfig;
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

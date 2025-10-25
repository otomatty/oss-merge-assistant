# 実装計画 - バージョン範囲指定と除外設定機能

**作成日:** 2025 年 10 月 25 日  
**機能名:** バージョン範囲指定と除外設定機能  
**優先度:** 高  
**見積もり:** 2-3 時間

---

## 目的

### ユーザーの課題

1. **上流の範囲指定**

   - 現状: 常に最新の upstream/main との差分を見ている
   - 問題: 「v1.0.0 から v2.0.0 まで」のような特定範囲の確認ができない
   - 要望: バージョンタグや特定コミット範囲を指定したい

2. **除外ディレクトリ設定**
   - 現状: すべてのファイル差分を表示
   - 問題: `node_modules/`, `dist/`, `.next/` などのビルド成果物が差分に含まれる
   - 要望: 特定ディレクトリを差分チェックから除外したい

### 実装する機能

1. **上流範囲指定機能**

   - タグベースの範囲指定（例: `v1.0.0..v2.0.0`）
   - コミットハッシュ範囲指定（例: `abc123..def456`）
   - ブランチ+タグの混在対応

2. **除外設定機能**
   - Glob パターンでの除外指定
   - プリセット除外パターン（node_modules など）
   - カスタム除外ルールの追加・編集・削除

---

## 設計

### 1. データモデル拡張

#### 設定ファイル構造（`.oss-assist/config.json`）

```json
{
  "upstreamUrl": "https://github.com/original/repo.git",
  "targetBranch": "main",
  "localBaseBranch": "develop",

  // 新規追加
  "versionRange": {
    "enabled": false,
    "from": "", // タグ名 or コミットハッシュ or ブランチ名
    "to": "", // タグ名 or コミットハッシュ or ブランチ名
    "compareMode": "branch" // "branch" | "tag" | "commit" | "range"
  },

  // 新規追加
  "exclusions": {
    "enabled": true,
    "patterns": [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "*.log",
      ".env*"
    ],
    "usePresets": true, // プリセットパターンを使用
    "customPatterns": [] // ユーザー定義の追加パターン
  }
}
```

#### TypeScript 型定義（`src/types/index.ts`）

```typescript
export interface VersionRange {
  enabled: boolean;
  from: string;
  to: string;
  compareMode: "branch" | "tag" | "commit" | "range";
}

export interface ExclusionConfig {
  enabled: boolean;
  patterns: string[];
  usePresets: boolean;
  customPatterns: string[];
}

export interface OSSConfig {
  upstreamUrl: string;
  targetBranch: string;
  localBaseBranch: string;
  versionRange?: VersionRange; // 新規追加
  exclusions?: ExclusionConfig; // 新規追加
}
```

---

### 2. UI 設計

#### 2.1 設定画面の拡張（SettingsWebview）

##### タブ構成

```
┌─ Basic Settings ─┬─ Version Range ─┬─ Exclusions ─┐
```

##### Version Range タブ

```html
┌─ Version Range Configuration ────────────────────┐ │ │ │ ○ Compare with branch
(default) │ │ └─ Target Branch: [main ▼] │ │ │ │ ○ Compare with specific version
range │ │ ├─ From: [v1.0.0 ▼] [🔍 Browse Tags] │ │ ├─ To: [v2.0.0 ▼] [🔍 Browse
Tags] │ │ └─ Mode: [Tag ▼] (Tag/Commit/Branch) │ │ │ │ 📊 Preview: Comparing 156
commits │ │ │ │ [Apply] [Reset] │
└───────────────────────────────────────────────────┘
```

##### Exclusions タブ

```html
┌─ File Exclusion Settings ────────────────────────┐ │ │ │ ☑ Enable exclusions │
│ │ │ ┌─ Preset Patterns ─────────────────────────────┐│ │ │ ☑ node_modules/**
││ │ │ ☑ dist/** ││ │ │ ☑ build/** ││ │ │ ☑ .next/** ││ │ │ ☑ *.log ││ │ │ ☑
.env* ││ │ └───────────────────────────────────────────────┘│ │ │ │ ┌─ Custom
Patterns ─────────────────────────────┐│ │ │ [+ Add Pattern] ││ │ │ ││ │ │ •
coverage/** [Edit] [Delete] ││ │ │ • tmp/** [Edit] [Delete] ││ │
└───────────────────────────────────────────────┘│ │ │ │ 🧪 Test Pattern:
[src/test/**] [Test] │ │ Results: ✅ Matches 15 files │ │ │ │ [Save] [Reset to
Defaults] │ └───────────────────────────────────────────────────┘
```

#### 2.2 TreeView の拡張

現在の表示:

```
├─ 🎯 Project Status
│   ├─ Upstream: origin/main ↑ 12 commits behind
```

拡張後:

```
├─ 🎯 Project Status
│   ├─ Upstream: origin/main ↑ 12 commits behind
│   ├─ Range: v1.0.0..v2.0.0 (if enabled)
│   ├─ Excluded: 3 directories
```

---

### 3. 実装詳細

#### Phase 1: 型定義とデータモデル（30 分）

**ファイル:** `src/types/index.ts`

1. `VersionRange` インターフェース追加
2. `ExclusionConfig` インターフェース追加
3. `OSSConfig` に新フィールド追加

#### Phase 2: ConfigService の拡張（30 分）

**ファイル:** `src/services/configService.ts`

**新規メソッド:**

```typescript
class ConfigService {
  // 既存メソッド
  // ...

  /**
   * Get default version range config
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
   * Get default exclusion config
   */
  getDefaultExclusions(): ExclusionConfig {
    return {
      enabled: true,
      patterns: [
        "node_modules/**",
        "dist/**",
        "build/**",
        ".next/**",
        "*.log",
        ".env*",
      ],
      usePresets: true,
      customPatterns: [],
    };
  }

  /**
   * Validate version range config
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
        errors.push("Range mode requires both from and to");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test exclusion pattern
   */
  testExclusionPattern(pattern: string, testPath: string): boolean {
    // minimatch または micromatch を使用
    return minimatch(testPath, pattern);
  }
}
```

#### Phase 3: GitService の拡張（45 分）

**ファイル:** `src/services/gitService.ts`

**新規メソッド:**

```typescript
class GitService {
  /**
   * List all tags in upstream repository
   */
  async getUpstreamTags(): Promise<string[]> {
    try {
      await this.executeGit(["fetch", "upstream", "--tags"]);
      const result = await this.executeGit([
        "tag",
        "--list",
        "--sort=-version:refname",
      ]);

      return result.stdout
        .split("\n")
        .filter((tag) => tag.trim())
        .map((tag) => tag.trim());
    } catch (error) {
      console.error("Failed to get upstream tags:", error);
      return [];
    }
  }

  /**
   * Get commits in version range
   */
  async getCommitsInRange(
    from: string,
    to: string,
    mode: "branch" | "tag" | "commit" | "range"
  ): Promise<UpstreamCommit[]> {
    try {
      let range: string;

      switch (mode) {
        case "branch":
          range = `${this.localBaseBranch}..upstream/${
            to || this.targetBranch
          }`;
          break;
        case "tag":
        case "commit":
        case "range":
          range = from && to ? `${from}..${to}` : to;
          break;
      }

      const result = await this.executeGit([
        "log",
        range,
        "--pretty=format:%H|%an|%ae|%at|%s",
        "--no-merges",
      ]);

      return this.parseCommitLog(result.stdout);
    } catch (error) {
      console.error("Failed to get commits in range:", error);
      return [];
    }
  }

  /**
   * Get modified files with exclusions
   */
  async getModifiedFilesWithExclusions(
    targetBranch: string,
    exclusions: ExclusionConfig
  ): Promise<ModifiedFile[]> {
    const allFiles = await this.getModifiedFiles(targetBranch);

    if (!exclusions.enabled) {
      return allFiles;
    }

    const patterns = [
      ...(exclusions.usePresets ? exclusions.patterns : []),
      ...exclusions.customPatterns,
    ];

    return allFiles.filter((file) => {
      return !patterns.some((pattern) => minimatch(file.path, pattern));
    });
  }

  /**
   * Get statistics about exclusions
   */
  async getExclusionStats(
    targetBranch: string,
    exclusions: ExclusionConfig
  ): Promise<{ total: number; excluded: number; included: number }> {
    const allFiles = await this.getModifiedFiles(targetBranch);
    const includedFiles = await this.getModifiedFilesWithExclusions(
      targetBranch,
      exclusions
    );

    return {
      total: allFiles.length,
      excluded: allFiles.length - includedFiles.length,
      included: includedFiles.length,
    };
  }
}
```

**依存関係追加:**

```bash
npm install minimatch
npm install --save-dev @types/minimatch
```

#### Phase 4: SettingsWebview の拡張（60 分）

**ファイル:** `src/webview/settingsWebview.ts`

**UI 拡張:**

1. タブナビゲーション追加
2. Version Range タブ実装
3. Exclusions タブ実装
4. タグ選択ドロップダウン
5. パターンテスト機能

**HTML 構造:**

```html
<div class="tabs">
  <button class="tab active" data-tab="basic">Basic Settings</button>
  <button class="tab" data-tab="version">Version Range</button>
  <button class="tab" data-tab="exclusions">Exclusions</button>
</div>

<div class="tab-content" id="basic-tab">
  <!-- 既存の設定UI -->
</div>

<div class="tab-content hidden" id="version-tab">
  <!-- Version Range UI -->
</div>

<div class="tab-content hidden" id="exclusions-tab">
  <!-- Exclusions UI -->
</div>
```

**メッセージハンドラ拡張:**

```typescript
private async handleWebviewMessage(message: any): Promise<void> {
  switch (message.command) {
    case 'testConnection':
      await this.testConnection(message.config);
      break;
    case 'saveConfig':
      await this.saveConfig(message.config);
      break;
    // 新規追加
    case 'loadTags':
      await this.loadUpstreamTags();
      break;
    case 'testExclusionPattern':
      await this.testExclusionPattern(message.pattern);
      break;
    case 'previewVersionRange':
      await this.previewVersionRange(message.range);
      break;
  }
}
```

#### Phase 5: TreeProvider の更新（15 分）

**ファイル:** `src/providers/ossTreeProvider.ts`

**更新内容:**

1. バージョン範囲情報の表示
2. 除外統計の表示
3. `getModifiedFiles()` 呼び出しを `getModifiedFilesWithExclusions()` に変更

```typescript
private async loadData(): Promise<void> {
  try {
    this.config = await this.configService.loadConfig();

    if (this.config && (await this.gitService.isGitRepository())) {
      await this.gitService.addUpstreamRemote(this.config.upstreamUrl);

      // Version range対応
      if (this.config.versionRange?.enabled) {
        this.gitStatus = await this.getStatusWithRange(this.config.versionRange);
      } else {
        this.gitStatus = await this.gitService.getGitStatus(
          this.config.targetBranch
        );
      }

      // Exclusions対応
      this.modifiedFiles = await this.gitService.getModifiedFilesWithExclusions(
        this.config.targetBranch,
        this.config.exclusions || this.configService.getDefaultExclusions()
      );
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }

  this.refresh();
}
```

---

## テスト計画

### テストケース 1: バージョン範囲指定

**手順:**

1. Settings を開く
2. Version Range タブに移動
3. 「Compare with specific version range」を選択
4. From: `v1.0.0`, To: `v2.0.0` を選択
5. 保存
6. TreeView で確認

**期待結果:**

- ✅ 指定範囲のコミットのみが表示される
- ✅ Status に「Range: v1.0.0..v2.0.0」と表示される

### テストケース 2: 除外パターン

**手順:**

1. Settings を開く
2. Exclusions タブに移動
3. プリセットパターンを有効化
4. カスタムパターン `test/**` を追加
5. 保存
6. TreeView で確認

**期待結果:**

- ✅ `node_modules/`, `dist/` 内のファイルが表示されない
- ✅ `test/` 内のファイルが表示されない
- ✅ Status に「Excluded: X files」と表示される

### テストケース 3: パターンテスト

**手順:**

1. Exclusions タブでパターンテスト機能を使用
2. パターン: `src/**/*.test.ts`
3. Test を実行

**期待結果:**

- ✅ マッチするファイル数が表示される
- ✅ マッチ/非マッチが視覚的にわかる

### テストケース 4: タグ一覧取得

**手順:**

1. Version Range タブを開く
2. 「Browse Tags」ボタンをクリック

**期待結果:**

- ✅ upstream のタグ一覧が表示される
- ✅ バージョン順にソートされている

---

## 実装順序

### Phase 1: データモデル（30 分）

1. ✅ `src/types/index.ts` - 型定義追加
2. ✅ デフォルト設定の定義

### Phase 2: バックエンド（1 時間）

3. ✅ `src/services/configService.ts` - 設定管理拡張
4. ✅ `src/services/gitService.ts` - Git 操作拡張
5. ✅ `minimatch` パッケージ追加

### Phase 3: UI 実装（1 時間 30 分）

6. ✅ `src/webview/settingsWebview.ts` - タブ UI 実装
7. ✅ Version Range タブ実装
8. ✅ Exclusions タブ実装

### Phase 4: 統合とテスト（30 分）

9. ✅ `src/providers/ossTreeProvider.ts` - 表示更新
10. ✅ 手動テスト実行
11. ✅ ドキュメント更新

---

## リスクと対策

### リスク 1: Git タグの取得失敗

**リスク:** upstream にタグがない、またはネットワークエラー

**対策:**

- タグ取得失敗時はブランチモードにフォールバック
- エラーメッセージを適切に表示
- オフライン時は既存のローカルタグを使用

### リスク 2: 除外パターンのパフォーマンス

**リスク:** 大量のファイルに対するパターンマッチングが遅い

**対策:**

- minimatch のキャッシュ機能を活用
- パターンマッチングを非同期で実行
- プログレス表示を追加

### リスク 3: 範囲指定の複雑さ

**リスク:** ユーザーが範囲指定を理解しにくい

**対策:**

- プレビュー機能でコミット数を表示
- デフォルトはブランチ比較（従来通り）
- ツールチップで説明を追加

---

## 完了条件

- [x] 型定義追加完了
- [x] ConfigService 拡張完了
- [x] GitService 拡張完了
- [x] minimatch パッケージ追加
- [x] SettingsWebview タブ UI 実装完了
- [x] Version Range タブ実装完了
- [x] Exclusions タブ実装完了
- [x] TreeProvider 表示更新完了
- [x] コンパイルエラーなし
- [ ] 全テストケースが成功（実機テスト待ち）
- [x] DEPENDENCY MAP 更新完了
- [x] 作業ログ作成完了

---

## 関連ドキュメント

- 要件定義: `docs/requirement.md`
- 既存実装: `docs/05_logs/2025_10/20251025/01_mvp-implementation.md`
- 前回修正: `docs/05_logs/2025_10/20251025/02_fix-check-updates.md`

---

## 備考

この機能により、以下のユースケースが実現できます：

1. **特定バージョン間の変更確認**

   - 「v1.0.0 から v2.0.0 で何が変わったか」を確認
   - リリースノート作成の補助

2. **クリーンな差分表示**

   - ビルド成果物を除外した真の差分のみ表示
   - レビュー効率の向上

3. **柔軟な比較**
   - タグ、コミット、ブランチの混在比較
   - 過去バージョンとの比較も可能

**推定作業時間:** 2-3 時間  
**実装難易度:** 中  
**優先度:** 高（ユーザー要望）

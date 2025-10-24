# 実装計画 - Check Updates 機能の修正

**作成日:** 2025 年 10 月 25 日  
**機能名:** Check Updates 機能の修正  
**優先度:** 高  
**見積もり:** 30 分

---

## 問題の特定

### 現象

設定を保存した後に「Check Updates」を実行すると、以下のエラーメッセージが表示される：

```
Please configure OSS Merge Assistant first
```

### 原因分析

#### 1. 設定の読み込みタイミング

**ファイル:** `src/providers/ossTreeProvider.ts`

**問題箇所:**

```typescript
constructor(private workspaceRoot: string) {
  this.configService = ConfigService.getInstance(workspaceRoot);
  this.gitService = GitService.getInstance(workspaceRoot);
  this.loadData(); // ← コンストラクタで1回だけ実行
}

private config: OSSConfig | null = null; // ← 初期化時にnullのまま
```

**問題点:**

- `loadData()`はコンストラクタで 1 回だけ実行される
- その後、設定を保存しても`this.config`が更新されない
- `updateStatus()`メソッドは`this.config`が null の場合にエラーを返す

#### 2. 設定保存後の TreeView 更新不足

**ファイル:** `src/webview/settingsWebview.ts`

**現在の実装:**

```typescript
case "save":
  await configService.saveConfig(message.config);
  // ← TreeProviderへの通知が不足
  break;
```

**問題点:**

- 設定保存後に TreeProvider に通知していない
- TreeProvider は古い状態（config=null）のまま

---

## 解決策

### アプローチ 1: TreeProvider の reload()を呼び出す（推奨）

設定保存後に TreeProvider の`reload()`メソッドを呼び出して、設定を再読み込みする。

**メリット:**

- シンプルで理解しやすい
- 既存の`reload()`メソッドを活用
- 副作用が少ない

**デメリット:**

- TreeProvider への参照が必要

### アプローチ 2: イベント駆動で通知

設定変更をイベントとして通知し、TreeProvider が自動的に更新する。

**メリット:**

- 疎結合で拡張性が高い
- 複数のリスナーに対応可能

**デメリット:**

- 実装が複雑
- オーバーエンジニアリング

### 選択: アプローチ 1 を採用

MVP 段階ではシンプルさを優先し、アプローチ 1 を採用します。

---

## 実装計画

### ステップ 1: SettingsWebview に TreeProvider 参照を追加

**ファイル:** `src/webview/settingsWebview.ts`

**変更内容:**

1. コンストラクタに TreeProvider 参照を追加

```typescript
constructor(
  private context: vscode.ExtensionContext,
  private workspaceRoot: string,
  private treeProvider: OSSTreeProvider  // ← 追加
) {
  // ...
}
```

2. 設定保存後に TreeProvider を reload

```typescript
case "save":
  await configService.saveConfig(message.config);
  await this.treeProvider.reload(); // ← 追加
  break;
```

### ステップ 2: extension.ts で TreeProvider 参照を渡す

**ファイル:** `src/extension.ts`

**変更内容:**

SettingsWebview の初期化時に TreeProvider を渡す

```typescript
// Initialize tree provider (先に初期化)
treeProvider = new OSSTreeProvider(workspaceRoot);
vscode.window.registerTreeDataProvider("ossAssistantView", treeProvider);

// Initialize settings webview (TreeProviderを渡す)
settingsWebview = new SettingsWebview(context, workspaceRoot, treeProvider);
```

### ステップ 3: TreeProvider の reload()メソッドを公開

**ファイル:** `src/providers/ossTreeProvider.ts`

**確認内容:**

`reload()`メソッドが既に public として実装されていることを確認

```typescript
async reload(): Promise<void> {
  await this.loadData();
}
```

✅ 既に実装済み - 変更不要

---

## テスト計画

### テストケース 1: 初回設定後の Check Updates

**手順:**

1. 拡張機能を起動（F5）
2. TreeView で「Open Settings」をクリック
3. Upstream URL、ブランチを設定して保存
4. TreeView で「Check Updates」をクリック

**期待結果:**

- ✅ エラーメッセージが表示されない
- ✅ 「Checking upstream updates...」プログレスが表示される
- ✅ 「Status updated successfully」メッセージが表示される
- ✅ TreeView のステータスが更新される

### テストケース 2: 設定変更後の Check Updates

**手順:**

1. 既に設定済みの状態で開始
2. 設定画面を開き、ブランチを変更して保存
3. 「Check Updates」をクリック

**期待結果:**

- ✅ 新しい設定が反映される
- ✅ 正しいブランチでチェックされる

### テストケース 3: 設定削除後の Check Updates

**手順:**

1. `.oss-assist/config.json`を削除
2. 「Check Updates」をクリック

**期待結果:**

- ✅ 「Please configure OSS Merge Assistant first」メッセージが表示される
- ✅ エラーが発生しない

---

## 実装順序

### Phase 1: コア修正（15 分）

1. ✅ `src/webview/settingsWebview.ts`

   - コンストラクタシグネチャ変更
   - TreeProvider 参照を保存
   - save 時に reload()を呼び出し

2. ✅ `src/extension.ts`
   - SettingsWebview 初期化時に TreeProvider を渡す
   - 初期化順序の調整

### Phase 2: テスト（10 分）

3. ✅ 手動テスト実行
   - テストケース 1, 2, 3 を実行
   - 問題があれば修正

### Phase 3: ドキュメント更新（5 分）

4. ✅ DEPENDENCY MAP 更新

   - settingsWebview.ts の Dependency Map を更新
   - TreeProvider への依存を追加

5. ✅ 作業ログ作成
   - 修正内容を記録

---

## リスクと対策

### リスク 1: 循環参照

**リスク:** TreeProvider ← SettingsWebview ← TreeProvider の循環参照

**対策:**

- TreeProvider は SettingsWebview に依存していない
- 一方向の依存のみなので問題なし

### リスク 2: reload()の非同期処理

**リスク:** reload()完了前に Check Updates が実行される

**対策:**

- reload()を await で待機
- ユーザーには保存完了メッセージで通知

### リスク 3: 既存機能への影響

**リスク:** コンストラクタシグネチャ変更による既存コードへの影響

**対策:**

- コンパイラがエラーを検出
- extension.ts のみが呼び出し元なので影響範囲は限定的

---

## 完了条件

- [x] 問題分析完了
- [x] `settingsWebview.ts`の修正完了
- [x] `extension.ts`の修正完了
- [x] コンパイルエラーなし
- [x] 全テストケースが成功
- [x] DEPENDENCY MAP 更新完了
- [x] 作業ログ作成完了

---

## 関連ドキュメント

- Issue: 設定保存後の Check Updates 実行エラー
- Spec: `docs/requirement.md`（MVP Phase 1）
- Log: `docs/05_logs/2025_10/20251025/01_mvp-implementation.md`

---

## 備考

この修正により、設定保存と TreeView の同期が確実になり、ユーザーは設定保存後すぐに Check Updates 機能を使用できるようになります。

**推定作業時間:** 30 分  
**実装難易度:** 低  
**優先度:** 高（MVP 機能の基本動作に関わる）

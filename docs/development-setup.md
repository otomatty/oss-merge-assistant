# OSS Merge Assistant - 開発環境セットアップガイド

**バージョン:** 1.0  
**最終更新:** 2025 年 10 月 24 日  
**対象読者:** 開発者

## 概要

このドキュメントでは、OSS Merge Assistant 拡張機能を開発環境で実行し、UI を確認する手順を説明します。

## 前提条件

### 必要なソフトウェア

- **Visual Studio Code** (1.105.0 以上)
- **Node.js** (16.x 以上推奨)
- **npm** または **yarn**
- **Git** (2.0 以上)

### 開発環境の確認

以下のコマンドで環境を確認してください：

```bash
# Node.js バージョン確認
node --version

# npm バージョン確認
npm --version

# Git バージョン確認
git --version

# VS Code バージョン確認
code --version
```

## セットアップ手順

### 1. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリに移動
cd /path/to/oss-merge-assitant

# 依存関係のインストール
npm install

# TypeScript の型チェック
npm run check-types

# ESLint によるコードチェック
npm run lint

# 初回コンパイル
npm run compile
```

### 2. 開発用ビルドの開始

開発中は、ファイル変更を自動検知してコンパイルするウォッチモードを使用します：

```bash
# ウォッチモードの開始（TypeScript + esbuild）
npm run watch
```

または、VS Code のタスクを使用：

1. `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`) でコマンドパレットを開く
2. `Tasks: Run Task` を選択
3. `watch` を選択

### 3. 拡張機能のデバッグ実行

#### 方法 1: F5 キーによる実行（推奨）

1. VS Code で本プロジェクトを開く
2. `F5` キーを押す
3. 「Extension Development Host」という新しい VS Code ウィンドウが開く
4. この新しいウィンドウで拡張機能がアクティブになる

#### 方法 2: デバッグビューからの実行

1. VS Code のサイドバーで「実行とデバッグ」(Run and Debug) ビューを開く
2. 「拡張機能の実行」(Run Extension) を選択
3. 緑の再生ボタンをクリック

#### 方法 3: コマンドパレットからの実行

1. `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`) でコマンドパレットを開く
2. `Debug: Start Debugging` を選択
3. 「Extension Development Host」ウィンドウが開く

## UI 確認手順

### 1. 拡張機能のアクティベーション確認

「Extension Development Host」ウィンドウで：

1. **コンソール確認**

   - `Help > Toggle Developer Tools` で DevTools を開く
   - Console タブで以下のメッセージを確認：

   ```
   OSS Merge Assistant is now active!
   ```

2. **コマンド確認**
   - `Ctrl + Shift + P` でコマンドパレットを開く
   - `OSS Merge Assistant` で検索
   - 以下のコマンドが表示されることを確認：
     - `OSS Merge Assistant: Open Settings`
     - `OSS Merge Assistant: Check Updates`
     - `OSS Merge Assistant: Reload OSS Assistant`

### 2. サイドバー UI 確認

1. **拡張機能ビューの表示**

   - エクスプローラーサイドバーを開く (`Ctrl + Shift + E`)
   - 「OSS MERGE ASSISTANT」セクションが表示されることを確認

2. **初期状態の確認**

   ```
   📊 OSS Merge Assistant
   ├─ ⚠️ Not Configured
   ├─ 🔄 Actions
   ├─ Check Updates
   └─ Open Settings
   ```

3. **ツールバーアイコン確認**
   - ビュータイトル右側に「🔄」（更新）と「⚙️」（設定）アイコンが表示される

### 3. 設定画面 UI 確認

1. **設定画面を開く**

   - サイドバーの「Open Settings」をクリック
   - または、コマンドパレットで `OSS Merge Assistant: Open Settings` を実行

2. **Webview 確認項目**

   - [x] タイトル：「OSS Merge Assistant Settings」
   - [x] 入力フィールド：「Upstream Repository URL」
   - [x] セレクトボックス：「Target Branch」「Local Base Branch」
   - [x] ボタン：「Test Connection」「Save Settings」「Reset to Default」
   - [x] VS Code テーマに合わせた色合い

3. **機能テスト**
   ```
   設定例：
   Upstream Repository URL: https://github.com/microsoft/vscode.git
   Target Branch: main
   Local Base Branch: main
   ```
   - 「Test Connection」をクリック
   - 「Save Settings」をクリック

### 4. Git リポジトリでのテスト

#### テスト用リポジトリの準備

1. **新しい Git リポジトリを作成**

   ```bash
   mkdir test-oss-project
   cd test-oss-project
   git init
   echo "# Test Project" > README.md
   git add README.md
   git commit -m "Initial commit"
   ```

2. **VS Code でプロジェクトを開く**

   ```bash
   code .
   ```

3. **拡張機能を F5 で起動**
   - 「Extension Development Host」でテストプロジェクトを開く

#### 実際の OSS プロジェクトでのテスト

より現実的なテストのために：

1. **著名な OSS プロジェクトを fork**

   - 例：https://github.com/microsoft/TypeScript
   - 自分の GitHub アカウントに fork

2. **ローカルにクローン**

   ```bash
   git clone https://github.com/[your-username]/TypeScript.git
   cd TypeScript
   code .
   ```

3. **拡張機能で設定**
   - Upstream Repository URL: `https://github.com/microsoft/TypeScript.git`
   - Target Branch: `main`

## トラブルシューティング

### よくある問題と解決方法

#### 1. 拡張機能が起動しない

**症状:** F5 を押しても「Extension Development Host」が開かない

**解決方法:**

1. `.vscode/launch.json` の確認
2. `npm run compile` でコンパイルエラーがないか確認
3. VS Code の再起動

#### 2. サイドバーに表示されない

**症状:** エクスプローラーに「OSS Merge Assistant」が表示されない

**解決方法:**

1. ワークスペースが開かれているか確認
2. `package.json` の `contributes.views` 設定を確認
3. 拡張機能の再読み込み (`Ctrl + R` in Extension Development Host)

#### 3. 設定画面が表示されない

**症状:** 「Open Settings」をクリックしても何も起こらない

**解決方法:**

1. Developer Tools でコンソールエラーを確認
2. `settingsWebview.ts` のコンパイルエラーを確認
3. Webview の権限設定を確認

#### 4. Git 操作でエラーが発生

**症状:** 「Check Updates」でエラーメッセージが表示される

**解決方法:**

1. 現在のディレクトリが Git リポジトリか確認：`git status`
2. リモートリポジトリの設定確認：`git remote -v`
3. アクセス権限の確認（SSH 鍵、HTTPS トークンなど）

### デバッグ方法

#### 1. ログの確認

**拡張機能のログ:**

```javascript
// Developer Tools > Console で確認
console.log メッセージを探す
```

**Git コマンドのデバッグ:**

```bash
# 手動でgitコマンドを実行してテスト
git fetch upstream
git rev-list --left-right --count HEAD...upstream/main
```

#### 2. ブレークポイントの設置

1. VS Code でソースコードにブレークポイントを設置
2. F5 でデバッグモードを開始
3. Extension Development Host で操作実行
4. メインの VS Code でブレークポイントで停止

#### 3. 変数の確認

デバッグ中に以下を確認：

- `workspaceRoot`: ワークスペースパス
- `config`: 読み込まれた設定
- `gitStatus`: Git 状態

## パフォーマンス確認

### メモリ使用量

1. **Task Manager での確認**

   - Extension Development Host のメモリ使用量
   - 通常の VS Code と比較

2. **Developer Tools での確認**
   - Memory タブでヒープ使用量を確認

### 応答速度

1. **初期化時間**

   - F5 押下から拡張機能アクティベーションまでの時間
   - 目標：3 秒以内

2. **Git 操作時間**
   - 「Check Updates」実行から結果表示まで
   - 目標：10 秒以内（ネットワーク状況による）

## 開発ワークフロー

### 通常の開発サイクル

1. **コード変更**

   ```bash
   # ファイル編集後
   npm run compile  # または watch mode
   ```

2. **テスト実行**

   - Extension Development Host で `Ctrl + R` (リロード)
   - または F5 で再デバッグ

3. **本格テスト**
   ```bash
   npm test
   ```

### コード品質確認

```bash
# 型チェック
npm run check-types

# リンター実行
npm run lint

# 全体チェック
npm run compile
```

## 本番リリース準備

### パッケージング

```bash
# 本番用ビルド
npm run package

# .vsix ファイルの生成（将来実装）
vsce package
```

### 最終確認項目

- [ ] 全ての MVP 機能が正常動作
- [ ] エラーハンドリングが適切
- [ ] 設定の永続化が正常
- [ ] 複数の OSS プロジェクトで動作確認
- [ ] パフォーマンスが要件を満たす

---

このガイドに従って開発環境をセットアップし、実装した MVP 機能の動作を確認してください。問題が発生した場合は、トラブルシューティングセクションを参照してください。

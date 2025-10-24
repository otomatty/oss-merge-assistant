# 🚀 OSS Merge Assistant - クイックスタートガイド

**最終更新:** 2025 年 10 月 24 日

## ⚡ 今すぐ始める（5 分で実行）

### 1. 拡張機能をデバッグモードで起動

現在のプロジェクトが既にセットアップされているので、以下の手順で即座に実行できます：

#### ステップ 1: VS Code でプロジェクトを開く

```bash
cd /Users/sugaiakimasa/apps/oss-merge-assitant
code .
```

#### ステップ 2: F5 キーを押してデバッグ実行

1. **F5** キーを押す
2. 「Extension Development Host」という新しい VS Code ウィンドウが開く
3. コンソールに `OSS Merge Assistant is now active!` と表示される

### 2. UI 確認手順

#### サイドバーの確認

「Extension Development Host」ウィンドウで：

1. **エクスプローラーを開く** (`Ctrl + Shift + E`)
2. **「OSS MERGE ASSISTANT」セクションを確認**

期待する表示：

```
📊 OSS Merge Assistant
├─ ⚠️ Not Configured
├─ 🔄 Actions
├─ Check Updates
└─ Open Settings
```

#### 設定画面の確認

1. **「Open Settings」をクリック**
2. **設定用の Webview が開く**

期待する画面：

- タイトル：「OSS Merge Assistant Settings」
- 入力欄：Upstream Repository URL
- 選択欄：Target Branch、Local Base Branch
- ボタン：Test Connection、Save Settings、Reset to Default

### 3. 基本機能テスト

#### 設定の保存テスト

設定画面で以下を入力：

```
Upstream Repository URL: https://github.com/microsoft/vscode.git
Target Branch: main
Local Base Branch: main
```

1. **「Test Connection」をクリック**  
   → ✅ 成功メッセージまたは ❌ エラーメッセージが表示される

2. **「Save Settings」をクリック**  
   → ✅ 「Settings saved successfully!」が表示される

#### ファイル確認

設定保存後、以下のファイルが作成される：

```
.oss-assist/
└── config.json
```

内容例：

```json
{
  "upstreamUrl": "https://github.com/microsoft/vscode.git",
  "targetBranch": "main",
  "localBaseBranch": "main",
  "lastSync": "2025-10-24T12:00:00.000Z"
}
```

## 🧪 実践的なテスト

### 実際の Git プロジェクトでテスト

#### 1. テスト用リポジトリの作成

```bash
# 新しいディレクトリを作成
mkdir test-oss-project
cd test-oss-project

# Gitリポジトリを初期化
git init
echo "# Test OSS Project" > README.md
git add README.md
git commit -m "Initial commit"

# VS Codeで開く
code .
```

#### 2. Extension Development Host でテストプロジェクトを開く

1. **「Extension Development Host」ウィンドウで**
2. **File > Open Folder** でテストプロジェクトを開く
3. **サイドバーを確認**

#### 3. 実際の OSS リポジトリとの連携テスト

設定例：

```
Upstream Repository URL: https://github.com/microsoft/TypeScript.git
Target Branch: main
Local Base Branch: main
```

保存後、「Check Updates」をクリックして動作確認。

## 🔧 開発中の変更確認

### ホットリロード（推奨）

ファイルを変更した場合：

1. **ウォッチモードを起動**（未起動の場合）

   ```bash
   npm run watch
   ```

2. **Extension Development Host で Ctrl + R**
   - 拡張機能がリロードされる
   - 変更が即座に反映される

### 完全再起動

変更がうまく反映されない場合：

1. **Extension Development Host を閉じる**
2. **メインの VS Code で再度 F5** を押す

## 📋 チェックリスト

### 基本動作確認

- [ ] F5 で Extension Development Host が起動する
- [ ] サイドバーに「OSS Merge Assistant」が表示される
- [ ] 「Open Settings」で設定画面が開く
- [ ] 設定の保存ができる
- [ ] `.oss-assist/config.json`が作成される

### Git 機能確認

- [ ] Git リポジトリで「Not Configured」から「Project Status」に変わる
- [ ] 「Test Connection」が動作する
- [ ] 「Check Updates」で fetch が実行される
- [ ] Behind 状況が表示される（存在する場合）

### エラーハンドリング確認

- [ ] Git リポジトリでない場合の警告表示
- [ ] 無効な URL 入力時のエラー表示
- [ ] ネットワークエラー時の適切なメッセージ

## 🐛 よくある問題

### 問題 1: サイドバーに表示されない

**解決方法:**

1. ワークスペースフォルダが開かれているか確認
2. `Ctrl + R` で Extension Development Host をリロード

### 問題 2: 設定画面が開かない

**解決方法:**

1. F12 で Developer Tools を開いてエラーを確認
2. コンソールエラーメッセージを確認

### 問題 3: Git 操作でエラー

**解決方法:**

1. `git status`で Git リポジトリか確認
2. ネットワーク接続を確認
3. HTTPS アクセスの場合、認証情報を確認

## 🎯 次のテスト項目

MVP 機能が動作することを確認できたら：

1. **複数の OSS プロジェクトでテスト**
2. **実際の開発ワークフローでの使用感確認**
3. **パフォーマンス測定**
4. **エラーケースの網羅的テスト**

これで拡張機能の基本動作が確認できます！問題があれば、詳細なトラブルシューティングガイド（`docs/development-setup.md`）を参照してください。

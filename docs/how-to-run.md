# 🎬 即座に動作確認する方法

## 方法 1: 現在のプロジェクトで即座に確認（推奨）

### 1. F5 キーでデバッグ実行

```bash
# 現在のディレクトリで
code .  # VS Codeでプロジェクトを開く
# F5キーを押す → Extension Development Host が開く
```

### 2. 基本動作確認

- エクスプローラーサイドバーに「OSS Merge Assistant」が表示される
- 「Open Settings」で設定画面が開く
- 以下を入力してテスト：
  ```
  Upstream URL: https://github.com/microsoft/vscode.git
  Target Branch: main
  ```

---

## 方法 2: デモ環境で本格テスト

### 1. デモ環境を自動作成

```bash
# プロジェクトルートで実行
./scripts/setup-demo.sh
```

### 2. デモプロジェクトを開く

```bash
cd ~/oss-merge-assistant-demo
code oss-merge-assistant.code-workspace
```

### 3. 拡張機能をデバッグ実行

- `F5`キーで実行
- Extension Development Host でテストプロジェクトを選択
- 実際の OSS プロジェクトでの動作を確認

---

## 期待する動作

### ✅ 正常動作の確認ポイント

1. **サイドバー表示**

   ```
   📊 OSS Merge Assistant
   ├─ ⚠️ Not Configured / 📊 Project Status
   ├─ 🔄 Actions
   └─ 📁 Modified Files (数字)
   ```

2. **設定画面**

   - Webview が正常に開く
   - URL 入力・保存ができる
   - `.oss-assist/config.json`が作成される

3. **Git 機能**
   - Test Connection が動作
   - Check Updates で fetch 実行
   - Behind 状況の表示

### 🐛 問題が発生した場合

1. **コンパイルエラー**

   ```bash
   npm run compile
   ```

2. **拡張機能が表示されない**

   - Extension Development Host で `Ctrl + R` (リロード)
   - F12 でコンソールエラーを確認

3. **Git 操作エラー**
   - 現在のディレクトリが Git リポジトリか確認
   - ネットワーク接続を確認

---

## 🎯 次のステップ

動作確認ができたら：

1. **実際の OSS プロジェクトで試す**
2. **カスタマイズ機能の追加検討**
3. **Phase 2（自動化機能）の実装**

詳細な開発手順は `docs/development-setup.md` を参照してください。

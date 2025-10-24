# OSS Merge Assistant

**VS Code 拡張機能 - OSS ベースのカスタマイズ開発を効率化**

OSS（オープンソースソフトウェア）をベースとしたカスタマイズ開発において、「上流 OSS への追従」「独自カスタマイズ部分のメンテナンス」を半自動化し、開発者が本来注力すべき付加価値の高いカスタマイズ作業に集中できる環境を提供します。

## 🚀 クイックスタート

### 即座に試す（5 分）

1. **拡張機能をデバッグ実行**

   ```bash
   # このプロジェクトをVS Codeで開く
   code .

   # F5キーでデバッグ実行
   # → Extension Development Host が開く
   ```

2. **UI を確認**

   - エクスプローラーサイドバーに「OSS Merge Assistant」が表示される
   - 「Open Settings」で設定画面を開く
   - 上流リポジトリ URL（例：`https://github.com/microsoft/vscode.git`）を設定

3. **デモ環境の作成**

   ```bash
   # テスト用プロジェクトを自動作成
   ./scripts/setup-demo.sh

   # デモワークスペースを開く
   cd ~/oss-merge-assistant-demo
   code oss-merge-assistant.code-workspace
   ```

📖 **詳細手順:** [`docs/quick-start.md`](docs/quick-start.md)

## ✨ MVP 機能（Phase 1）

### 実装済み機能

- ✅ **基本設定機能**: 上流リポジトリ URL、追跡ブランチの設定
- ✅ **サイドバー UI**: プロジェクトステータス、クイックアクション
- ✅ **Git 操作**: 上流との接続確認、Behind 状況取得
- ✅ **差分可視化**: カスタマイズファイルの一覧表示
- ✅ **ファイルジャンプ**: クリックでエディタ表示

### UI プレビュー

**サイドバー表示例:**

```
📊 OSS Merge Assistant
├─ 📊 Project Status (↑ 5 commits behind)
├─ 🔄 Actions
│   ├─ Check Updates
│   └─ Open Settings
└─ 📁 Modified Files (3)
    ├─ src/components/Header.tsx
    ├─ config/app.json
    └─ README.md
```

**設定画面:** Webview による直感的な設定 UI

## 🎯 使用場面

- **OSS カスタマイズ開発**: React、Vue、Angular 等のフレームワークカスタマイズ
- **アップストリーム追従**: 上流の変更を定期的に取り込む必要がある開発
- **チーム開発**: カスタマイズ意図の共有とメンテナンス

## 📋 要件

- **Visual Studio Code** 1.105.0 以上
- **Git** 2.0 以上
- **Node.js** 16.x 以上（開発時）
- **対象プロジェクト**: Git リポジトリであること

## 🔧 開発環境セットアップ

### 依存関係インストール

```bash
npm install
```

### ビルド・テスト

```bash
# コンパイル
npm run compile

# ウォッチモード（開発時）
npm run watch

# テスト実行
npm test
```

### デバッグ実行

```bash
# 方法1: F5キー（推奨）
# 方法2: コマンドパレット > Debug: Start Debugging
# 方法3: Run and Debug ビューから実行
```

📖 **詳細セットアップ:** [`docs/development-setup.md`](docs/development-setup.md)

## 📚 ドキュメント

- 📋 **[要件定義書](docs/requirement.md)** - 全体仕様と実装計画
- 🚀 **[クイックスタート](docs/quick-start.md)** - 5 分で動作確認
- 🔧 **[開発環境セットアップ](docs/development-setup.md)** - 詳細な開発手順
- 📖 **[開発ガイドライン](.github/copilot-instructions.md)** - コーディング規則

## 🏗️ アーキテクチャ

```
src/
├── extension.ts              # メインエントリーポイント
├── types/index.ts           # 型定義
├── services/                # ビジネスロジック
│   ├── configService.ts     # 設定管理
│   └── gitService.ts        # Git操作
├── providers/               # VS Code Provider
│   └── ossTreeProvider.ts   # サイドバーTreeView
├── webview/                 # UI
│   └── settingsWebview.ts   # 設定画面
└── test/                    # テスト
    └── suite/extension.test.ts
```

## 🗺️ ロードマップ

### Phase 1: MVP ✅ **完了**

- 基本設定、状況可視化、手動操作

### Phase 2: 自動化（次期）

- 定期監視、ワークフロー自動化、通知

### Phase 3: 高度機能（将来）

- 自動コンフリクト解消、チーム連携、レポート

## 🤝 Contributing

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。

## 📞 サポート

- 💡 **機能要望**: Issues でお知らせください
- 🐛 **バグ報告**: 詳細な再現手順とともにお報告ください
- ❓ **質問**: Discussions でお気軽にお聞きください

---

**OSS 開発をもっと効率的に。** 🚀

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
# oss-merge-assistant

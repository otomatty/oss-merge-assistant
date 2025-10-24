#!/bin/bash

# OSS Merge Assistant - デモ環境セットアップスクリプト
# このスクリプトは拡張機能のデモ用テスト環境を自動作成します

set -e

echo "🚀 OSS Merge Assistant デモ環境セットアップ"
echo "============================================="

# 変数設定
DEMO_DIR="$HOME/oss-merge-assistant-demo"
TEST_PROJECT_DIR="$DEMO_DIR/test-project"
REAL_OSS_DIR="$DEMO_DIR/real-oss-example"

# 1. デモディレクトリの作成
echo "📁 デモディレクトリを作成中..."
mkdir -p "$DEMO_DIR"
cd "$DEMO_DIR"

# 2. テスト用Gitプロジェクトの作成
echo "🔧 テスト用プロジェクトを作成中..."
if [ ! -d "$TEST_PROJECT_DIR" ]; then
    mkdir -p "$TEST_PROJECT_DIR"
    cd "$TEST_PROJECT_DIR"
    
    git init
    echo "# Test OSS Project for OSS Merge Assistant" > README.md
    echo "" >> README.md
    echo "このプロジェクトは OSS Merge Assistant の動作テスト用です。" >> README.md
    echo "" >> README.md
    echo "## 使用方法" >> README.md
    echo "1. VS Code でこのフォルダを開く" >> README.md
    echo "2. OSS Merge Assistant の設定で以下を入力：" >> README.md
    echo "   - Upstream URL: https://github.com/microsoft/vscode.git" >> README.md
    echo "   - Target Branch: main" >> README.md
    
    # 基本ファイル構造を作成
    mkdir -p src/{components,services,utils}
    echo "export const VERSION = '1.0.0';" > src/version.ts
    echo "export class TestService {}" > src/services/testService.ts
    echo "export const utils = {};" > src/utils/index.ts
    
    cat > package.json << 'EOF'
{
  "name": "test-oss-project",
  "version": "1.0.0",
  "description": "Test project for OSS Merge Assistant",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"No tests specified\""
  },
  "keywords": ["test", "oss", "merge"],
  "author": "OSS Merge Assistant Team",
  "license": "MIT"
}
EOF
    
    git add .
    git commit -m "Initial commit: Basic project structure"
    
    # いくつかの変更を追加（カスタマイズをシミュレート）
    echo "// カスタマイズ: 独自機能追加" >> src/version.ts
    echo "export const CUSTOM_FEATURE = 'enabled';" >> src/version.ts
    git add src/version.ts
    git commit -m "feat: Add custom feature flag"
    
    echo "// カスタマイズ: 設定変更" > src/config.ts
    echo "export const config = { theme: 'custom', api: 'v2' };" >> src/config.ts
    git add src/config.ts
    git commit -m "feat: Add custom configuration"
    
    echo "✅ テスト用プロジェクト作成完了: $TEST_PROJECT_DIR"
fi

# 3. 実際のOSSプロジェクト例（TypeScript）のクローン
echo "📥 実際のOSSプロジェクト例をクローン中..."
if [ ! -d "$REAL_OSS_DIR" ]; then
    cd "$DEMO_DIR"
    
    # TypeScriptプロジェクトをクローン（軽量版）
    git clone --depth 1 https://github.com/microsoft/TypeScript.git "$REAL_OSS_DIR"
    cd "$REAL_OSS_DIR"
    
    # いくつかのカスタマイズをシミュレート
    echo "" >> README.md
    echo "## カスタマイズ情報" >> README.md
    echo "このプロジェクトには以下のカスタマイズが含まれています：" >> README.md
    echo "- 独自の設定ファイル" >> README.md
    echo "- カスタムビルドスクリプト" >> README.md
    
    git add README.md
    git commit -m "docs: Add customization information"
    
    # 独自ファイルを追加
    echo "// 独自カスタマイズ設定" > custom-config.json
    echo '{"customFeatures": true, "theme": "corporate"}' >> custom-config.json
    git add custom-config.json
    git commit -m "feat: Add custom configuration file"
    
    echo "✅ 実際のOSSプロジェクト例作成完了: $REAL_OSS_DIR"
fi

# 4. 設定例ファイルの作成
echo "📋 設定例ファイルを作成中..."
cat > "$DEMO_DIR/oss-merge-assistant-settings.md" << 'EOF'
# OSS Merge Assistant 設定例

## テスト用プロジェクト設定

### 基本テスト
```
Upstream Repository URL: https://github.com/microsoft/vscode.git
Target Branch: main
Local Base Branch: main
```

### TypeScript プロジェクトテスト
```
Upstream Repository URL: https://github.com/microsoft/TypeScript.git
Target Branch: main
Local Base Branch: main
```

### React プロジェクトテスト
```
Upstream Repository URL: https://github.com/facebook/react.git
Target Branch: main
Local Base Branch: main
```

## 使用手順

1. VS Code で以下のいずれかのプロジェクトを開く：
   - テスト用: `test-project/`
   - 実際のOSS: `real-oss-example/`

2. F5 キーで OSS Merge Assistant をデバッグ実行

3. サイドバーの「OSS Merge Assistant」で「Open Settings」をクリック

4. 上記設定例のいずれかを入力

5. 「Test Connection」「Save Settings」で動作確認

## 期待する動作

- ✅ 設定保存後、`.oss-assist/config.json` が作成される
- ✅ 「Check Updates」でBehind状況が表示される
- ✅ カスタマイズファイルが「Modified Files」に表示される
- ✅ ファイルクリックでエディタが開く
EOF

# 5. VS Code ワークスペース設定
echo "⚙️ VS Code ワークスペース設定を作成中..."
cat > "$DEMO_DIR/oss-merge-assistant.code-workspace" << 'EOF'
{
  "folders": [
    {
      "name": "Test Project",
      "path": "./test-project"
    },
    {
      "name": "Real OSS Example",
      "path": "./real-oss-example"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": false
    }
  },
  "extensions": {
    "recommendations": [
      "ms-vscode.vscode-typescript-next"
    ]
  }
}
EOF

# 6. 完了メッセージ
echo ""
echo "🎉 デモ環境セットアップ完了！"
echo "============================================="
echo ""
echo "📂 作成されたファイル："
echo "   $DEMO_DIR/"
echo "   ├── test-project/              # テスト用プロジェクト"
echo "   ├── real-oss-example/          # 実際のOSSプロジェクト例"
echo "   ├── oss-merge-assistant-settings.md # 設定例"
echo "   └── oss-merge-assistant.code-workspace # VS Codeワークスペース"
echo ""
echo "🚀 次のステップ："
echo "   1. cd '$DEMO_DIR'"
echo "   2. code oss-merge-assistant.code-workspace"
echo "   3. プロジェクトフォルダのいずれかを選択"
echo "   4. OSS Merge Assistant をF5でデバッグ実行"
echo ""
echo "📖 詳細な手順: docs/quick-start.md を参照"
echo ""
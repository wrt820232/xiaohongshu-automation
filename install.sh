#!/bin/bash
set -e

echo "🚀 小红书自动化控制 - 安装脚本"
echo "================================"

# 1. 安装 Node.js 依赖
echo "📦 安装依赖..."
npm install

# 2. 创建 .env 文件
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 已创建 .env 文件，请编辑填入 UNSPLASH_ACCESS_KEY"
else
  echo "✅ .env 文件已存在"
fi

# 3. 创建 images 目录
mkdir -p images

# 4. 检测并注册 Skill
echo ""
echo "📋 选择要注册的平台："
echo "  1) OpenClaw（推荐）"
echo "  2) Claude Code"
echo "  3) 两者都注册"
read -p "请选择 [1/2/3]: " -n 1 -r PLATFORM_CHOICE
echo ""

install_openclaw_skill() {
  OPENCLAW_SKILL_DIR="$HOME/.openclaw/workspace/skills/xiaohongshu-automation"
  mkdir -p "$OPENCLAW_SKILL_DIR"
  cp SKILL.md "$OPENCLAW_SKILL_DIR/SKILL.md"
  echo "✅ OpenClaw Skill 已注册到 $OPENCLAW_SKILL_DIR"
}

install_claude_skill() {
  CLAUDE_SKILL_DIR="$HOME/.claude/skills/xiaohongshu-automation"
  mkdir -p "$CLAUDE_SKILL_DIR"
  cp SKILL.md "$CLAUDE_SKILL_DIR/SKILL.md"
  echo "✅ Claude Code Skill 已注册到 $CLAUDE_SKILL_DIR"
}

case $PLATFORM_CHOICE in
  1)
    install_openclaw_skill
    ;;
  2)
    install_claude_skill
    ;;
  3)
    install_openclaw_skill
    install_claude_skill
    ;;
  *)
    echo "默认安装到 OpenClaw..."
    install_openclaw_skill
    ;;
esac

echo ""
echo "🎉 安装完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件，填入你的 UNSPLASH_ACCESS_KEY"
echo "   获取地址: https://unsplash.com/developers"
echo ""
echo "2. 确保 OpenClaw 浏览器已启动（CDP 端口 18800）"
echo ""
echo "3. 使用关键词触发 Skill："
echo "   - 小红书"
echo "   - xiaohongshu"
echo "   - xhs"

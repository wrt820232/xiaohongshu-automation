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

# 4. 注册为 Claude Code skill
SKILL_DIR="$HOME/.claude/skills/xiaohongshu-automation"
if [ ! -d "$SKILL_DIR" ]; then
  mkdir -p "$SKILL_DIR"
  cp SKILL.md "$SKILL_DIR/SKILL.md"
  echo "✅ Skill 已注册到 $SKILL_DIR"
else
  echo "⚠️  Skill 目录已存在: $SKILL_DIR"
  read -p "是否覆盖? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp SKILL.md "$SKILL_DIR/SKILL.md"
    echo "✅ Skill 已更新"
  fi
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件，填入你的 UNSPLASH_ACCESS_KEY"
echo "   获取地址: https://unsplash.com/developers"
echo ""
echo "2. 确保 OpenClaw 浏览器已启动（CDP 端口 18800）"
echo ""
echo "3. 在 Claude Code 中使用关键词触发："
echo "   - 小红书"
echo "   - xiaohongshu"
echo "   - xhs"

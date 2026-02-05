# 小红书自动化控制

使用 Unsplash API 获取高质量图片的自动化工具。

## 快速开始

### 1. 获取 Unsplash API Key

1. 访问 [Unsplash Developers](https://unsplash.com/developers)
2. 注册/登录账号
3. 创建一个新的 Application
4. 复制 Access Key

### 2. 配置环境变量

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export UNSPLASH_ACCESS_KEY="your_access_key_here"

# 重新加载配置
source ~/.zshrc
```

### 3. 安装依赖

```bash
npm install
```

### 4. 使用方式

#### 命令行使用

```bash
# 搜索并下载咖啡相关图片
npx ts-node src/unsplash.ts coffee --count 5 --dir ./images

# 下载横向风景图片
npx ts-node src/unsplash.ts nature --count 3 --orientation landscape

# 获取随机图片
npx ts-node src/unsplash.ts food --random

# 指定图片尺寸
npx ts-node src/unsplash.ts travel --size full --count 2
```

#### 代码中使用

```typescript
import { searchAndDownload, downloadRandomPhoto, searchPhotos } from './src';

// 搜索并下载图片
const images = await searchAndDownload('coffee', './images', 5, {
  orientation: 'landscape',
  size: 'regular'
});

// 下载随机图片
const randomImage = await downloadRandomPhoto('./images', {
  query: 'nature',
  orientation: 'portrait'
});

// 仅搜索（不下载）
const results = await searchPhotos({
  query: 'sunset',
  perPage: 10,
  orientation: 'landscape',
  color: 'orange'
});
```

## API 参考

### searchPhotos(options)

搜索 Unsplash 图片。

| 参数 | 类型 | 说明 |
|------|------|------|
| query | string | 搜索关键词（必需） |
| perPage | number | 每页数量 (1-30) |
| page | number | 页码 |
| orientation | string | 方向: landscape, portrait, squarish |
| color | string | 颜色过滤 |
| orderBy | string | 排序: relevant, latest |

### downloadPhoto(photo, destDir, size)

下载单张图片。

| 参数 | 类型 | 说明 |
|------|------|------|
| photo | UnsplashPhoto | 图片对象 |
| destDir | string | 保存目录 |
| size | string | 尺寸: raw, full, regular, small, thumb |

### searchAndDownload(query, destDir, count, options)

搜索并下载图片（一站式方法）。

### downloadRandomPhoto(destDir, options)

获取并下载随机图片。

## 图片尺寸说明

| 尺寸 | 说明 | 适用场景 |
|------|------|----------|
| raw | 原始尺寸 | 印刷、高清需求 |
| full | 完整尺寸 | 大屏展示 |
| regular | 1080px 宽 | 一般用途（推荐） |
| small | 400px 宽 | 缩略图 |
| thumb | 200px 宽 | 小图标 |

## 注意事项

1. **API 限制**: 免费版每小时 50 次请求
2. **归属要求**: 使用图片时需标注摄影师和 Unsplash
3. **下载统计**: 本工具会自动触发下载统计（遵循 Unsplash API 指南）

## License

MIT

---

## 🔧 Skill 安装（支持 OpenClaw / Claude Code）

本项目可以作为 **OpenClaw** 或 **Claude Code** 的 skill 使用，实现小红书自动化操作。

### 一键安装（推荐）

```bash
# 克隆仓库
git clone https://github.com/wrt820232/xiaohongshu-automation.git
cd xiaohongshu-automation

# 运行安装脚本（会提示选择平台）
chmod +x install.sh
./install.sh
```

安装脚本会提示选择：
- **1) OpenClaw** - 注册到 `~/.openclaw/workspace/skills/`
- **2) Claude Code** - 注册到 `~/.claude/skills/`
- **3) 两者都注册**

### 手动安装

#### OpenClaw 用户
```bash
git clone https://github.com/wrt820232/xiaohongshu-automation.git
cd xiaohongshu-automation
npm install
cp .env.example .env
# 编辑 .env，填入 UNSPLASH_ACCESS_KEY

# 注册 Skill
mkdir -p ~/.openclaw/workspace/skills/xiaohongshu-automation
cp SKILL.md ~/.openclaw/workspace/skills/xiaohongshu-automation/
```

#### Claude Code 用户
```bash
git clone https://github.com/wrt820232/xiaohongshu-automation.git
cd xiaohongshu-automation
npm install
cp .env.example .env

# 注册 Skill
mkdir -p ~/.claude/skills/xiaohongshu-automation
cp SKILL.md ~/.claude/skills/xiaohongshu-automation/
```

### 验证安装

输入以下任一关键词触发 skill：
- `小红书`
- `xiaohongshu`
- `xhs`
- `红书`

## 📋 小红书自动化功能

| 功能 | 说明 |
|------|------|
| 检查登录状态 | 检查小红书账号是否已登录 |
| 发布图文 | 发布图文内容到小红书 |
| 发布视频 | 发布视频内容 |
| 搜索内容 | 搜索小红书帖子 |
| 获取详情 | 获取帖子详细信息 |
| 发表评论 | 对帖子发表评论 |
| 获取热门话题 | 获取创作者中心热门话题 |
| 下载图片 | 从 Unsplash 下载无水印图片 |

### 前置条件

1. **OpenClaw 浏览器**：需要启动并开启 CDP 端口 18800
2. **已登录小红书**：首次使用需在浏览器中手动登录
3. **Playwright MCP**：确保已配置 Playwright MCP

## 🔗 相关链接

- [Unsplash API](https://unsplash.com/developers) - 获取 API Key
- [OpenClaw 浏览器](https://openclaw.com) - CDP 浏览器
- [Playwright 文档](https://playwright.dev)

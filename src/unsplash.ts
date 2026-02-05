/**
 * Unsplash 图片获取模块
 * 使用 Unsplash API 搜索和下载高质量图片
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Unsplash API 配置
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_API_BASE = 'https://api.unsplash.com';

export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
  };
}

export interface SearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export interface UnsplashOptions {
  /** 搜索关键词 */
  query: string;
  /** 每页数量 (1-30) */
  perPage?: number;
  /** 页码 */
  page?: number;
  /** 图片方向: landscape, portrait, squarish */
  orientation?: 'landscape' | 'portrait' | 'squarish';
  /** 颜色过滤 */
  color?: 'black_and_white' | 'black' | 'white' | 'yellow' | 'orange' | 'red' | 'purple' | 'magenta' | 'green' | 'teal' | 'blue';
  /** 排序方式 */
  orderBy?: 'relevant' | 'latest';
}

/**
 * 发送 HTTP GET 请求
 */
function httpGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept-Version': 'v1',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 下载文件到本地
 */
function downloadFile(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const request = (downloadUrl: string) => {
      https.get(downloadUrl, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {}); // 删除不完整的文件
        reject(err);
      });
    };

    request(url);
  });
}

/**
 * 检查 API Key 是否配置
 */
function checkApiKey(): void {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error(
      '未配置 Unsplash API Key!\n' +
      '请设置环境变量 UNSPLASH_ACCESS_KEY\n' +
      '获取 API Key: https://unsplash.com/developers'
    );
  }
}

/**
 * 搜索 Unsplash 图片
 */
export async function searchPhotos(options: UnsplashOptions): Promise<SearchResult> {
  checkApiKey();

  const params = new URLSearchParams({
    query: options.query,
    per_page: String(options.perPage || 10),
    page: String(options.page || 1),
  });

  if (options.orientation) {
    params.append('orientation', options.orientation);
  }
  if (options.color) {
    params.append('color', options.color);
  }
  if (options.orderBy) {
    params.append('order_by', options.orderBy);
  }

  const url = `${UNSPLASH_API_BASE}/search/photos?${params.toString()}`;
  const response = await httpGet(url, {
    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
  });

  return JSON.parse(response) as SearchResult;
}

/**
 * 获取随机图片
 */
export async function getRandomPhoto(options?: {
  query?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  count?: number;
}): Promise<UnsplashPhoto | UnsplashPhoto[]> {
  checkApiKey();

  const params = new URLSearchParams();
  if (options?.query) {
    params.append('query', options.query);
  }
  if (options?.orientation) {
    params.append('orientation', options.orientation);
  }
  if (options?.count) {
    params.append('count', String(Math.min(options.count, 30)));
  }

  const url = `${UNSPLASH_API_BASE}/photos/random?${params.toString()}`;
  const response = await httpGet(url, {
    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
  });

  return JSON.parse(response);
}

/**
 * 触发下载统计（遵循 Unsplash API 指南）
 */
export async function trackDownload(photo: UnsplashPhoto): Promise<void> {
  checkApiKey();

  await httpGet(photo.links.download_location, {
    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
  });
}

/**
 * 下载图片到本地
 * @param photo Unsplash 图片对象
 * @param destDir 目标目录
 * @param size 图片尺寸: raw, full, regular, small, thumb
 * @returns 下载后的文件路径
 */
export async function downloadPhoto(
  photo: UnsplashPhoto,
  destDir: string,
  size: 'raw' | 'full' | 'regular' | 'small' | 'thumb' = 'regular'
): Promise<string> {
  // 确保目录存在
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 生成文件名
  const ext = '.jpg';
  const filename = `unsplash_${photo.id}_${size}${ext}`;
  const destPath = path.join(destDir, filename);

  // 如果文件已存在，直接返回
  if (fs.existsSync(destPath)) {
    console.log(`图片已存在: ${destPath}`);
    return destPath;
  }

  // 触发下载统计（遵循 Unsplash API 指南）
  try {
    await trackDownload(photo);
  } catch (e) {
    console.warn('触发下载统计失败:', e);
  }

  // 下载图片
  const imageUrl = photo.urls[size];
  console.log(`正在下载: ${imageUrl}`);
  await downloadFile(imageUrl, destPath);
  console.log(`下载完成: ${destPath}`);

  return destPath;
}

/**
 * 搜索并下载图片（一站式方法）
 * @param query 搜索关键词
 * @param destDir 目标目录
 * @param count 下载数量
 * @param options 其他选项
 * @returns 下载的文件路径数组
 */
export async function searchAndDownload(
  query: string,
  destDir: string,
  count: number = 1,
  options?: {
    orientation?: 'landscape' | 'portrait' | 'squarish';
    size?: 'raw' | 'full' | 'regular' | 'small' | 'thumb';
  }
): Promise<string[]> {
  const searchResult = await searchPhotos({
    query,
    perPage: Math.min(count, 30),
    orientation: options?.orientation,
  });

  if (searchResult.results.length === 0) {
    console.warn(`未找到关键词 "${query}" 的图片`);
    return [];
  }

  const downloadedPaths: string[] = [];
  const photosToDownload = searchResult.results.slice(0, count);

  for (const photo of photosToDownload) {
    try {
      const filePath = await downloadPhoto(photo, destDir, options?.size || 'regular');
      downloadedPaths.push(filePath);
    } catch (error) {
      console.error(`下载图片 ${photo.id} 失败:`, error);
    }
  }

  return downloadedPaths;
}

/**
 * 获取随机图片并下载
 */
export async function downloadRandomPhoto(
  destDir: string,
  options?: {
    query?: string;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    size?: 'raw' | 'full' | 'regular' | 'small' | 'thumb';
  }
): Promise<string> {
  const photo = await getRandomPhoto({
    query: options?.query,
    orientation: options?.orientation,
  }) as UnsplashPhoto;

  return downloadPhoto(photo, destDir, options?.size || 'regular');
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Unsplash 图片下载工具

用法:
  npx ts-node src/unsplash.ts <关键词> [选项]

选项:
  --count <n>        下载数量 (默认: 1)
  --dir <path>       保存目录 (默认: ./images)
  --orientation <o>  方向: landscape, portrait, squarish
  --size <s>         尺寸: raw, full, regular, small, thumb (默认: regular)
  --random           获取随机图片

示例:
  npx ts-node src/unsplash.ts coffee --count 5 --dir ./images
  npx ts-node src/unsplash.ts nature --random --orientation landscape

环境变量:
  UNSPLASH_ACCESS_KEY  Unsplash API 密钥 (必需)
`);
    process.exit(0);
  }

  const query = args[0];
  const countIdx = args.indexOf('--count');
  const count = countIdx !== -1 ? parseInt(args[countIdx + 1], 10) : 1;
  const dirIdx = args.indexOf('--dir');
  const dir = dirIdx !== -1 ? args[dirIdx + 1] : './images';
  const orientationIdx = args.indexOf('--orientation');
  const orientation = orientationIdx !== -1 ? args[orientationIdx + 1] as any : undefined;
  const sizeIdx = args.indexOf('--size');
  const size = sizeIdx !== -1 ? args[sizeIdx + 1] as any : 'regular';
  const isRandom = args.includes('--random');

  (async () => {
    try {
      if (isRandom) {
        const filePath = await downloadRandomPhoto(dir, { query, orientation, size });
        console.log(`\n✅ 下载完成: ${filePath}`);
      } else {
        const filePaths = await searchAndDownload(query, dir, count, { orientation, size });
        console.log(`\n✅ 下载完成 ${filePaths.length} 张图片:`);
        filePaths.forEach((p) => console.log(`  - ${p}`));
      }
    } catch (error) {
      console.error('❌ 错误:', error);
      process.exit(1);
    }
  })();
}

/**
 * 小红书自动化控制 - 主入口
 */

// Gemini AI 图片生成 (推荐使用)
export * from './gemini-image';

// 重新导出 Gemini 常用函数
export {
  // 单张图片生成
  generateImage,
  generateImages,
  generateOOTDImage,
  generateFoodImage,
  generateTravelImage,
  generateHomeImage,
  // 一致性系列生成
  generateConsistentSeries,
  generateModelSeries,
  generateFoodSeries,
  generateOOTDTriptych,
  generateCoffeeTriptych,
} from './gemini-image';

// 导出类型
export type {
  GeminiImageOptions,
  GeneratedImage,
  ConsistentSeriesConfig,
  ModelConsistencyConfig,
  ProductConsistencyConfig,
} from './gemini-image';

// Unsplash 图片搜索 (备用)
export * from './unsplash';

// 重新导出 Unsplash 函数 (带前缀避免冲突)
export {
  searchPhotos as unsplashSearchPhotos,
  downloadPhoto as unsplashDownloadPhoto,
  searchAndDownload as unsplashSearchAndDownload,
  downloadRandomPhoto as unsplashDownloadRandomPhoto,
  getRandomPhoto as unsplashGetRandomPhoto,
} from './unsplash';

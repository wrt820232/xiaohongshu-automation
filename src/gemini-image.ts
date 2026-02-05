/**
 * Gemini 3 Pro Image Preview - AI 图片生成模块
 * 使用 Gemini API 生成小红书风格的超写实图片
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Gemini API 配置
const GEMINI_API_URL = 'https://api.duojie.games/v1/messages';
const GEMINI_API_KEY = 'sk-RKIzq2w9hvEbMaoNnJ5iZhKrxikx875cQlizyx9fwMSWlNGm';
const GEMINI_MODEL = 'gemini-3-pro-image-preview';

export interface GeminiImageOptions {
  /** 图片描述提示词 */
  prompt: string;
  /** 输出目录 */
  outputDir?: string;
  /** 输出文件名（不含扩展名） */
  filename?: string;
  /** 图片风格 */
  style?: 'xiaohongshu' | 'realistic' | 'artistic' | 'custom';
  /** 图片方向 (9:16 竖版适合小红书) */
  orientation?: 'portrait' | 'landscape' | 'square';
}

export interface GeneratedImage {
  /** 文件路径 */
  filePath: string;
  /** 文件大小 (bytes) */
  size: number;
  /** 媒体类型 */
  mediaType: string;
  /** 原始提示词 */
  prompt: string;
  /** 增强后的提示词 */
  enhancedPrompt: string;
}

/**
 * 一致性系列生成配置
 * 用于生成同一主体在不同场景/角度的多张图片
 */
export interface ConsistentSeriesConfig {
  /** 固定的主体特征（模特外貌、穿搭、物品特征等） */
  subjectDescription: string;
  /** 不同的场景/姿势/角度变化 */
  variations: string[];
  /** 输出目录 */
  outputDir?: string;
  /** 文件名前缀 */
  filenamePrefix?: string;
  /** 系列类型 */
  seriesType: 'model' | 'food' | 'product' | 'scene';
  /** 图片方向 */
  orientation?: 'portrait' | 'landscape' | 'square';
}

/**
 * 模特一致性配置
 */
export interface ModelConsistencyConfig {
  /** 面部特征 */
  face: string;
  /** 发型 */
  hair: string;
  /** 身材 */
  bodyType?: string;
  /** 穿搭描述 */
  outfit: string;
  /** 妆容 */
  makeup?: string;
  /** 配饰 */
  accessories?: string;
  /** 整体风格 */
  overallStyle?: string;
}

/**
 * 食物/产品一致性配置
 */
export interface ProductConsistencyConfig {
  /** 产品/食物描述 */
  product: string;
  /** 容器/摆盘 */
  presentation: string;
  /** 色调风格 */
  colorTone?: string;
  /** 背景元素 */
  backgroundElements?: string;
}

/**
 * 增强提示词 - 手机直出感 / 生活化 / 小红书街拍风格
 */
function enhancePrompt(
  basePrompt: string,
  style: GeminiImageOptions['style'] = 'xiaohongshu',
  orientation: GeminiImageOptions['orientation'] = 'portrait'
): string {
  // 手机直出感 - 避免过度精修，保持真实感
  const mobilePhotoFeel = [
    'iPhone 15 Pro Max photo',
    'natural smartphone photography',
    'no heavy retouching',
    'authentic candid moment',
    'slight lens flare acceptable',
    'natural motion blur if moving',
    'real life snapshot aesthetic',
  ].join(', ');

  // 小红书生活化风格
  const xiaohongshuLifestyle = [
    '小红书爆款风格',
    'casual lifestyle vibe',
    'effortlessly chic',
    'relatable daily life moment',
    'cozy and warm atmosphere',
    'soft natural daylight',
    'gentle shadows',
    'muted warm color palette',
    'slightly overexposed highlights',
    'creamy skin tones',
  ].join(', ');

  // 街拍风格
  const streetSnapStyle = [
    'street style photography',
    'urban backdrop',
    'candid pose not stiff',
    'walking or natural movement',
    'environmental portrait',
    'city life atmosphere',
    'golden hour or soft overcast light',
    'shallow depth of field',
    'blurred pedestrians or cars in background',
  ].join(', ');

  // 真实人像 - 不要太完美，要有生活感
  const authenticPortrait = [
    'real person not AI looking',
    'natural imperfections',
    'genuine smile or relaxed expression',
    'natural skin texture with pores',
    'flyaway hair strands',
    'natural body proportions',
    'not overly posed',
    'comfortable and confident',
  ].join(', ');

  // 女性特征 - 甜美温柔邻家感
  const feminineFeatures = [
    'sweet and gentle expression',
    'girl-next-door vibe',
    'soft feminine features',
    'natural charm',
    'friendly and warm smile',
    'approachable and relatable',
    'youthful and fresh looking',
    'innocent and pure aesthetic',
  ].join(', ');

  // 人物脸部一致性提示词 - 超写实手机自拍风格 + 白幼瘦
  const faceConsistencyPrompt = `
Ultra realistic smartphone selfie, front-facing camera, eye-level angle, centered composition, neutral head position.

The SAME 20-year-old girl, consistent facial identity, identical facial structure across generations, no random face variation.

Small oval face with slightly rounded cheeks, short chin length, narrow soft jawline, balanced facial symmetry, stable bone structure, V-shaped face, delicate bone structure.

Large round almond-shaped eyes, parallel double eyelids, medium-wide eye spacing, subtle aegyo-sal, slightly downturned outer corners, bright clear pupils, sparkling innocent eyes.

Straight medium-high nose bridge, small refined nose tip, narrow nostrils, compact proportional nose.

Small heart-shaped mouth, defined cupid's bow, soft pink lips, slightly upturned lip corners, gentle closed-mouth smile.

Shorter mid-face ratio, youthful facial thirds 1:1:1, harmonious facial proportions, consistent facial geometry.

VERY FAIR porcelain white skin, bright luminous complexion, glass skin effect, translucent glowing skin, subtle blush on cheeks and nose, soft dewy glow, non-plastic skin, 白皙透亮肌肤.

Slim petite body frame, thin arms and legs, delicate slender figure, 白幼瘦 aesthetic, youthful innocent appearance, baby-faced features.

Soft dark brown hair with light airy bangs, medium length, same hairstyle, same hair color.

Maintain the same person appearance, same face, same identity, only minor natural micro-variation.

Authentic smartphone color science, soft window daylight, bright and airy lighting, slight natural imperfections, true-to-life colors.
`;

  // 方向说明 - 更符合手机拍摄习惯
  const orientationGuide = {
    portrait: 'vertical 9:16 phone screen ratio, full body or 3/4 shot, leave headroom',
    landscape: 'horizontal 16:9, environmental wide shot, subject off-center',
    square: 'square 1:1 Instagram crop, tight framing, subject centered',
  };

  // 避免的元素 - 让AI知道不要做什么
  const avoidElements = 'avoid: overly smooth skin, plastic look, perfect symmetry, studio lighting, heavy makeup, stiff poses, artificial backgrounds';

  // 检测是否需要人物（包含人物相关关键词）
  const needsHumanFace = /女|girl|模特|穿搭|街拍|旅行|自拍|人物|ootd|outfit|portrait|selfie/i.test(basePrompt);

  // 根据风格组合提示词
  let enhancedPrompt = basePrompt;

  switch (style) {
    case 'xiaohongshu':
      if (needsHumanFace) {
        // 包含人物的场景，启用脸部一致性提示词
        enhancedPrompt = `${basePrompt}

${faceConsistencyPrompt}

Style requirements:
${mobilePhotoFeel}
${xiaohongshuLifestyle}
${streetSnapStyle}
${feminineFeatures}
${orientationGuide[orientation]}

${avoidElements}`;
      } else {
        // 不包含人物的场景（美食、家居等）
        enhancedPrompt = `${basePrompt}

Style requirements:
${mobilePhotoFeel}
${xiaohongshuLifestyle}
${orientationGuide[orientation]}

${avoidElements}`;
      }
      break;
    case 'realistic':
      enhancedPrompt = `${basePrompt}

Style: ${authenticPortrait}, ${mobilePhotoFeel}
Composition: ${orientationGuide[orientation]}
${avoidElements}`;
      break;
    case 'artistic':
      enhancedPrompt = `${basePrompt}

Style: artistic street photography, creative angles, dramatic lighting, cinematic mood
${orientationGuide[orientation]}`;
      break;
    case 'custom':
    default:
      enhancedPrompt = `${basePrompt}
${mobilePhotoFeel}
${orientationGuide[orientation]}`;
      break;
  }

  return enhancedPrompt;
}

/**
 * 发送 HTTPS POST 请求
 */
function httpsPost(
  url: string,
  data: object,
  headers: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers,
      },
      timeout: 180000, // 3分钟超时
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 使用 Gemini 3 Pro 生成图片（带重试机制）
 */
export async function generateImage(options: GeminiImageOptions & { maxRetries?: number }): Promise<GeneratedImage> {
  const {
    prompt,
    outputDir = './generated-images',
    filename,
    style = 'xiaohongshu',
    orientation = 'portrait',
    maxRetries = 3,
  } = options;

  // 增强提示词
  const enhancedPrompt = enhancePrompt(prompt, style, orientation);

  console.log('🎨 正在生成图片...');
  console.log(`📝 原始提示词: ${prompt.substring(0, 80)}...`);
  console.log(`✨ 增强提示词: ${enhancedPrompt.substring(0, 100)}...`);

  // 构建请求
  const requestBody = {
    model: GEMINI_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: enhancedPrompt,
      },
    ],
  };

  const headers = {
    'x-api-key': GEMINI_API_KEY,
    'anthropic-version': '2023-06-01',
  };

  // 带重试的请求
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 重试第 ${attempt}/${maxRetries} 次...`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      // 发送请求
      const response = await httpsPost(GEMINI_API_URL, requestBody, headers);
      const data = JSON.parse(response);

      // 解析响应，提取图片
      for (const block of data.content || []) {
        if (block.type === 'image') {
          const source = block.source || {};
          const b64Data = source.data || '';
          const mediaType = source.media_type || 'image/jpeg';

          if (!b64Data) {
            throw new Error('响应中没有图片数据');
          }

          // 解码 Base64
          const imgBuffer = Buffer.from(b64Data, 'base64');

          // 确保目录存在
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // 生成文件名
          const ext = mediaType === 'image/png' ? '.png' : '.jpg';
          const finalFilename = filename || `gemini_${Date.now()}`;
          const filePath = path.join(outputDir, `${finalFilename}${ext}`);

          // 保存文件
          fs.writeFileSync(filePath, imgBuffer);

          console.log(`✅ 图片已保存: ${filePath}`);
          console.log(`📐 大小: ${(imgBuffer.length / 1024).toFixed(1)} KB`);

          return {
            filePath,
            size: imgBuffer.length,
            mediaType,
            prompt,
            enhancedPrompt,
          };
        }
      }

      // 如果没有图片，记录错误并重试
      lastError = new Error('API 响应中未找到图片');
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ 第 ${attempt} 次尝试失败: ${lastError.message}`);
    }
  }

  throw lastError || new Error('生成图片失败');
}

/**
 * 批量生成图片
 */
export async function generateImages(
  prompts: string[],
  options?: Omit<GeminiImageOptions, 'prompt'>
): Promise<GeneratedImage[]> {
  const results: GeneratedImage[] = [];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n📸 生成第 ${i + 1}/${prompts.length} 张图片...`);
    try {
      const result = await generateImage({
        ...options,
        prompt: prompts[i],
        filename: options?.filename ? `${options.filename}_${i + 1}` : undefined,
      });
      results.push(result);
    } catch (error) {
      console.error(`❌ 生成第 ${i + 1} 张图片失败:`, error);
    }

    // 添加延迟避免请求过快
    if (i < prompts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * 生成小红书穿搭图片
 */
export async function generateOOTDImage(
  description: string,
  outputDir?: string
): Promise<GeneratedImage> {
  // 检测是否是自拍类型
  const isSelfie = /自拍|对镜|镜子|selfie|mirror/i.test(description);

  let prompt: string;

  if (isSelfie) {
    // 自拍/对镜自拍模式
    prompt = `${description}

拍摄方式：对镜自拍，手机拍摄全身镜，手机入镜
场景：卧室、试衣间、洗手间镜子前（真实居家环境）
姿势：单手举手机自拍，另一只手自然下垂或叉腰，微微侧身显瘦
表情：看着手机屏幕，嘟嘴或微笑，自然可爱
光线：室内自然光或暖色灯光，不要太暗
构图：全身或大半身入镜，镜子里能看到完整穿搭

女生模特要求：20岁亚洲女生，白幼瘦，甜美可爱`;
  } else {
    // 街拍模式
    prompt = `一张手机随手拍的街拍穿搭照：${description}

场景：城市街道、咖啡店门口、商场、公园小路（任选其一，要有生活气息）
穿搭：${description}
氛围：阳光洒下来的温暖感，像闺蜜帮忙拍的那种随意但好看
构图：不要正中间，稍微偏一点，留点环境，背景有路人或车辆虚化更真实

女生模特要求：20-28岁亚洲女生，甜美温柔的邻家女孩气质`;
  }

  return generateImage({
    prompt,
    outputDir,
    style: 'xiaohongshu',
    orientation: 'portrait',
  });
}

/**
 * 生成小红书美食图片
 */
export async function generateFoodImage(
  description: string,
  outputDir?: string
): Promise<GeneratedImage> {
  const prompt = `一张手机拍的美食照片：${description}

场景：咖啡店、brunch餐厅、家里餐桌、野餐垫上（要有生活感）
食物：${description}，不要摆得太刻意，像刚端上来准备吃的样子
光线：窗边自然光，有点过曝的那种温暖感
构图：45度角或俯拍，旁边可以有手机、杂志、花、餐具等生活小物
色调：暖黄色调，ins风格，让人看了想吃`;

  return generateImage({
    prompt,
    outputDir,
    style: 'xiaohongshu',
    orientation: 'square',
  });
}

/**
 * 生成小红书旅行图片
 */
export async function generateTravelImage(
  description: string,
  outputDir?: string
): Promise<GeneratedImage> {
  const prompt = `一张旅行中随手拍的照片：${description}

场景：${description}，要有当地特色和氛围感
穿搭：适合旅行的舒适穿搭，裙子或阔腿裤随风飘动更好
光线：黄金时刻（日出日落前后）或阴天柔光
氛围：像男朋友或闺蜜随手抓拍的瞬间，有故事感

女生模特要求：亚洲女生背影或侧面，甜美温柔气质`;

  return generateImage({
    prompt,
    outputDir,
    style: 'xiaohongshu',
    orientation: 'portrait',
  });
}

/**
 * 生成小红书家居图片
 */
export async function generateHomeImage(
  description: string,
  outputDir?: string
): Promise<GeneratedImage> {
  const prompt = `一张手机拍的家居生活照：${description}

场景：真实居住的家，不是样板间，要有生活痕迹
细节：${description}，可以有书、杯子、绿植、毯子等生活小物随意摆放
光线：清晨或午后的自然光从窗户洒进来，有光影变化
氛围：温馨慵懒的周末在家感觉，让人想躺下来
构图：不要太整齐，有点随意但舒服，像躺在沙发上随手拍的`;

  return generateImage({
    prompt,
    outputDir,
    style: 'xiaohongshu',
    orientation: 'portrait',
  });
}

/**
 * 构建模特一致性描述
 * 将模特特征固定，确保多张图片中模特外观一致
 */
function buildModelDescription(config: ModelConsistencyConfig): string {
  const parts = [
    `同一位模特，固定外貌特征：`,
    `面部特征：${config.face}`,
    `发型：${config.hair}`,
    config.bodyType ? `身材：${config.bodyType}` : '',
    `穿搭：${config.outfit}`,
    config.makeup ? `妆容：${config.makeup}` : '',
    config.accessories ? `配饰：${config.accessories}` : '',
    config.overallStyle ? `整体风格：${config.overallStyle}` : '',
    `【重要：保持模特外貌、穿搭在所有图片中完全一致】`,
  ].filter(Boolean);

  return parts.join('，');
}

/**
 * 构建产品/食物一致性描述
 */
function buildProductDescription(config: ProductConsistencyConfig): string {
  const parts = [
    `同一产品/食物，固定特征：`,
    `主体：${config.product}`,
    `呈现方式：${config.presentation}`,
    config.colorTone ? `色调：${config.colorTone}` : '',
    config.backgroundElements ? `背景元素：${config.backgroundElements}` : '',
    `【重要：保持产品外观、摆盘风格在所有图片中完全一致】`,
  ].filter(Boolean);

  return parts.join('，');
}

/**
 * 生成一致性系列图片
 * 同一主体（模特/食物/产品）在不同场景/角度的多张图片
 */
export async function generateConsistentSeries(
  config: ConsistentSeriesConfig
): Promise<GeneratedImage[]> {
  const {
    subjectDescription,
    variations,
    outputDir = './generated-images',
    filenamePrefix = 'series',
    seriesType,
    orientation = 'portrait',
  } = config;

  const results: GeneratedImage[] = [];

  // 根据系列类型构建一致性强调
  const consistencyEmphasis = {
    model: '【关键：这是同一位模特的系列照片，必须保持面部特征、发型、穿搭、身材比例完全一致，只改变姿势和场景】',
    food: '【关键：这是同一道食物/饮品的系列照片，必须保持食物外观、摆盘、容器完全一致，只改变拍摄角度和光线】',
    product: '【关键：这是同一产品的系列照片，必须保持产品外观、颜色、细节完全一致，只改变展示角度和背景】',
    scene: '【关键：这是同一场景的系列照片，必须保持场景布置、色调风格完全一致，只改变视角和焦点】',
  };

  console.log(`\n🎬 开始生成一致性系列图片...`);
  console.log(`📋 主体描述: ${subjectDescription.substring(0, 50)}...`);
  console.log(`🔢 变化数量: ${variations.length}`);
  console.log(`📁 输出目录: ${outputDir}`);

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    console.log(`\n📸 生成第 ${i + 1}/${variations.length} 张: ${variation}`);

    // 构建完整提示词，强调一致性
    const fullPrompt = `${subjectDescription}

当前场景/变化：${variation}

${consistencyEmphasis[seriesType]}

小红书风格，超写实摄影，8K高清，专业打光，自然色调`;

    try {
      const result = await generateImage({
        prompt: fullPrompt,
        outputDir,
        filename: `${filenamePrefix}_${i + 1}`,
        style: 'xiaohongshu',
        orientation,
      });
      results.push(result);
    } catch (error) {
      console.error(`❌ 生成第 ${i + 1} 张失败:`, error);
    }

    // 延迟避免请求过快
    if (i < variations.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n✅ 系列生成完成! 成功 ${results.length}/${variations.length} 张`);
  return results;
}

/**
 * 生成模特穿搭系列（同一模特不同姿势/场景）
 */
export async function generateModelSeries(
  modelConfig: ModelConsistencyConfig,
  scenes: string[],
  outputDir?: string
): Promise<GeneratedImage[]> {
  const subjectDescription = buildModelDescription(modelConfig);

  return generateConsistentSeries({
    subjectDescription,
    variations: scenes,
    outputDir,
    filenamePrefix: 'model_series',
    seriesType: 'model',
    orientation: 'portrait',
  });
}

/**
 * 生成食物/饮品系列（同一食物不同角度）
 */
export async function generateFoodSeries(
  foodConfig: ProductConsistencyConfig,
  angles: string[],
  outputDir?: string
): Promise<GeneratedImage[]> {
  const subjectDescription = buildProductDescription(foodConfig);

  return generateConsistentSeries({
    subjectDescription,
    variations: angles,
    outputDir,
    filenamePrefix: 'food_series',
    seriesType: 'food',
    orientation: 'square',
  });
}

/**
 * 快捷方法：生成穿搭三连图
 * 同一模特同一穿搭，三个不同场景/姿势
 */
export async function generateOOTDTriptych(
  outfit: string,
  modelFeatures?: Partial<ModelConsistencyConfig>,
  outputDir?: string
): Promise<GeneratedImage[]> {
  const defaultModel: ModelConsistencyConfig = {
    face: '同一个20岁亚洲女生，小脸蛋，大眼睛双眼皮，高鼻梁小鼻头，心形嘴唇',
    hair: '深棕色柔顺头发，空气刘海，中长发',
    bodyType: '普通身材，正常女生的比例',
    outfit: outfit,
    makeup: '淡妆，皮肤白皙有光泽，脸颊微微泛红',
    overallStyle: '甜美温柔邻家女孩，friendly warm smile',
    ...modelFeatures,
  };

  const scenes = [
    '走在街上回头的瞬间，sweet smile，背景是城市街道',
    '咖啡店门口，低头浅笑，阳光从侧面打过来',
    '走在斑马线上，步伐轻盈，衣服随动作飘动',
  ];

  return generateModelSeries(defaultModel, scenes, outputDir);
}

/**
 * 快捷方法：生成咖啡三连图
 * 同一杯咖啡，三个不同角度
 */
export async function generateCoffeeTriptych(
  coffeeDescription: string,
  outputDir?: string
): Promise<GeneratedImage[]> {
  const coffeeConfig: ProductConsistencyConfig = {
    product: coffeeDescription,
    presentation: '普通咖啡店的杯子，不用太精致，真实的样子',
    colorTone: '自然暖色调，手机直出的感觉，不要调色过度',
    backgroundElements: '咖啡店真实环境，可以有点杂乱，菜单、纸巾、手机都可以入镜',
  };

  const angles = [
    '刚端上来准备喝的角度，手可以入镜，像在跟朋友说"看我点的"',
    '喝了一口放下，杯子上有口红印也OK，旁边有手机或书，生活感',
    '俯拍整个桌面，咖啡是主角但周围有其他东西，真实的下午茶场景',
  ];

  return generateFoodSeries(coffeeConfig, angles, outputDir);
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Gemini 3 Pro 图片生成工具

用法:
  npx ts-node src/gemini-image.ts <提示词> [选项]

选项:
  --dir <path>         保存目录 (默认: ./generated-images)
  --filename <name>    文件名 (不含扩展名)
  --style <s>          风格: xiaohongshu, realistic, artistic, custom (默认: xiaohongshu)
  --orientation <o>    方向: portrait, landscape, square (默认: portrait)
  --ootd               穿搭模式
  --food               美食模式
  --travel             旅行模式
  --home               家居模式

一致性系列生成:
  --ootd-series        穿搭三连图（同一模特不同场景）
  --coffee-series      咖啡三连图（同一咖啡不同角度）

示例:
  npx ts-node src/gemini-image.ts "一位穿着白色连衣裙的女孩在花园里"
  npx ts-node src/gemini-image.ts "秋冬韩系穿搭" --ootd --dir ./images
  npx ts-node src/gemini-image.ts "抹茶蛋糕" --food

  # 生成穿搭三连图（同一模特）
  npx ts-node src/gemini-image.ts "奶茶色大衣搭配白色高领毛衣和米色阔腿裤" --ootd-series

  # 生成咖啡三连图（同一杯咖啡）
  npx ts-node src/gemini-image.ts "手冲冰美式咖啡" --coffee-series
`);
    process.exit(0);
  }

  const prompt = args[0];
  const dirIdx = args.indexOf('--dir');
  const dir = dirIdx !== -1 ? args[dirIdx + 1] : './generated-images';
  const filenameIdx = args.indexOf('--filename');
  const filename = filenameIdx !== -1 ? args[filenameIdx + 1] : undefined;
  const styleIdx = args.indexOf('--style');
  const style = (styleIdx !== -1 ? args[styleIdx + 1] : 'xiaohongshu') as GeminiImageOptions['style'];
  const orientationIdx = args.indexOf('--orientation');
  const orientation = (orientationIdx !== -1 ? args[orientationIdx + 1] : 'portrait') as GeminiImageOptions['orientation'];

  const isOOTD = args.includes('--ootd');
  const isFood = args.includes('--food');
  const isTravel = args.includes('--travel');
  const isHome = args.includes('--home');
  const isOOTDSeries = args.includes('--ootd-series');
  const isCoffeeSeries = args.includes('--coffee-series');

  (async () => {
    try {
      // 一致性系列生成
      if (isOOTDSeries) {
        console.log('\n👗 生成穿搭三连图（同一模特不同场景）...\n');
        const results = await generateOOTDTriptych(prompt, undefined, dir);
        console.log(`\n✅ 穿搭三连图生成完成!`);
        results.forEach((r, i) => console.log(`  ${i + 1}. ${r.filePath}`));
        return;
      }

      if (isCoffeeSeries) {
        console.log('\n☕ 生成咖啡三连图（同一咖啡不同角度）...\n');
        const results = await generateCoffeeTriptych(prompt, dir);
        console.log(`\n✅ 咖啡三连图生成完成!`);
        results.forEach((r, i) => console.log(`  ${i + 1}. ${r.filePath}`));
        return;
      }

      // 单张图片生成
      let result: GeneratedImage;

      if (isOOTD) {
        result = await generateOOTDImage(prompt, dir);
      } else if (isFood) {
        result = await generateFoodImage(prompt, dir);
      } else if (isTravel) {
        result = await generateTravelImage(prompt, dir);
      } else if (isHome) {
        result = await generateHomeImage(prompt, dir);
      } else {
        result = await generateImage({
          prompt,
          outputDir: dir,
          filename,
          style,
          orientation,
        });
      }

      console.log(`\n✅ 生成完成!`);
      console.log(`📁 文件: ${result.filePath}`);
      console.log(`📐 大小: ${(result.size / 1024).toFixed(1)} KB`);
    } catch (error) {
      console.error('❌ 错误:', error);
      process.exit(1);
    }
  })();
}

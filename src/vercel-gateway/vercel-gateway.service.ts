import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CalorieService } from '../calorie/calorie.service';
import { UserService } from '../user/user.service';
import { VercelAiClient, ChatMessage } from './vercel-ai.client';
import { ImageNutritionResponseDto } from './dto/image-nutrition.dto';
import type {} from 'multer';

const SYSTEM_PROMPT = `基于用户提供的身体数据、目标和近期饮食运动记录，直接给出个性化健康建议。

输出要求：
1. 不要介绍自己是谁，不要寒暄，直接进入建议。
2. 内容尽量简洁，优先给用户最有用、最可执行的结论。
3. 语言要自然、生动、轻快，但不要浮夸。
4. 建议按这四个部分组织：当前判断、根据目标指定计划、接下来怎么做、需要注意什么。
5. 尽量给出具体动作、食物、运动和习惯建议，少说空话。
6. 如果用户数据不足，直接指出缺什么，并给出在信息有限时也能立刻执行的建议。
7. 仅根据用户实际有记录的天数进行分析和判断，没有数据的日期不代表用户没有进食或运动，不要对无数据日期做任何假设。

安全要求：
1. 不提供极端节食、过度运动或有明显风险的方案。
2. 如果目标体重、热量摄入或身体状态存在健康风险，要明确提醒，但语气保持温和。
3. 不能替代医生诊断；涉及明显疾病风险时，建议及时就医或咨询专业医生。`;

@Injectable()
export class VercelGatewayService {
  private readonly logger = new Logger(VercelGatewayService.name);

  constructor(
    private readonly aiClient: VercelAiClient,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly calorieService: CalorieService,
  ) {}

  /**
   * 验证 Token 已配置，返回网关就绪状态（不发起外部请求）
   */
  ping() {
    return {
      status: 'ok',
      gateway: 'vercel-ai-gateway',
      model: this.aiClient.model,
    };
  }

  /**
   * 获取 AI 个性化健康建议
   * @param userId 当前用户 ID
   * @param question 用户问题（最大 500 字符）
   * @returns { suggestion, model }
   */
  async getSuggestion(userId: string, question: string) {
    const [profile, summary] = await Promise.all([
      this.userService.getFullProfile(userId),
      this.calorieService.summarizeLast7Days(userId),
    ]);

    const formatEntry = (entry: {
      title: string;
      calories: number;
      description: string;
      entryDate: Date;
    }) => {
      const d = new Date(entry.entryDate);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const desc = entry.description ? ` | ${entry.description}` : '';
      return `- ${mm}/${dd} ${hh}:${min}  ${entry.title}（${entry.calories} kcal）${desc}`;
    };

    const days = summary.daysWithData;

    const parts: string[] = [
      `基础信息：`,
      `身高：${profile?.latestHeight?.value ?? '暂无记录'} cm`,
      `当前体重：${profile?.latestWeight?.value ?? '暂无记录'} kg`,
      `目标体重：${profile?.targetWeight ?? '未设置'} kg`,
      `健康状态简述：${profile?.healthConditions?.join(', ') ?? '暂无填写'}`,
    ];

    if (summary.intakeEntries.length) {
      parts.push(
        '',
        `近7日饮食记录（摄入，共 ${days} 天有数据）：`,
        summary.intakeEntries.map(formatEntry).join('\n'),
      );
    }

    if (summary.burnEntries.length) {
      parts.push(
        '',
        `近7日运动记录（消耗，共 ${days} 天有数据）：`,
        summary.burnEntries.map(formatEntry).join('\n'),
      );
    }

    if (days > 0) {
      const intakeAvg = Math.round(summary.intakeTotal / days);
      const burnAvg = Math.round(summary.burnTotal / days);
      const netAvg = intakeAvg - burnAvg;
      parts.push(
        '',
        `统计汇总（仅基于有记录的 ${days} 天）：`,
        `- 摄入：共 ${summary.intakeTotal} kcal，日均 ${intakeAvg} kcal，${summary.intakeCount} 条记录`,
        `- 消耗：共 ${summary.burnTotal} kcal，日均 ${burnAvg} kcal，${summary.burnCount} 条记录`,
        `- 日均净热量差（摄入-消耗）：${netAvg} kcal`,
      );
    } else {
      parts.push('', '近7日暂无饮食或运动记录。');
    }

    parts.push('', `我的问题：${question}`);

    const userMessage = parts.join('\n');

    const suggestion = await this.aiClient.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      800,
    );

    return { suggestion: suggestion || '暂无建议', model: this.aiClient.model };
  }

  private static readonly IMAGE_NUTRITION_PROMPT = `你是一位资深的营养学专家和视觉分析助手，擅长通过图片精确估算食物的营养价值。

## 任务
分析上传的图片（可能是实拍图、外卖包装图或手机菜单截图），并提供结构化的营养成分分析。

## 核心原则：始终独立估算 + 交叉验证
**无论图片中是否包含文字，你都必须先根据食物的外观、种类、烹饪方式和分量，独立估算出营养数值。** 图片中的文字仅作为辅助参考，且必须通过交叉验证后才能采信。

## 识别与提取逻辑
1. **第零步（必做）**：先扫描整张图片，**逐一清点所有可见的食物主体**（包括每个碗、盘、杯、包装中的食物），列出完整清单。每一个独立容器或独立摆放的食物都算一个主体，不得遗漏、合并或降级为"附加项"
2. **第一步（必做）**：对上一步清单中的**每一个食物主体**，分别通过视觉识别其种类、烹饪方式（如油炸、清蒸）和大致分量，独立估算营养数值
3. **第二步（可选）**：如果图片中有文字信息（如菜名、配料表、标称营养数据），提取并与第一步的估算值做交叉验证，如果菜单出现XXX+XXX+XXX表示其实是三个菜品的套餐
4. **采信规则**：
   - 如果文字中明确标注了带营养单位（kcal、大卡、千焦、kJ、g、mg）的数值，且与独立估算偏差在合理范围（±50%）内，采信文字标注值
   - 如果文字数值与独立估算偏差过大（超过±50%），以独立估算值为准，在 summary 中说明
   - 如果文字中没有营养单位标注，一律以独立估算值为准
5. **单一主体拆解（必做）**：当画面中仅有一个食物主体（如一碗面、一份盖饭、一个汉堡套餐），必须将其拆解为可识别的食材组成部分（如面条、汤底、肉片、蔬菜…），**每种食材单独输出一条**，以便用户了解各成分的营养贡献。只有完全无法拆分的单一食材（如一根香蕉、一杯纯牛奶）才允许输出单条

## 文字识别防误判规则
- ¥、￥、元、USD、$、价、售价、原价、特价 等前后的数字是**价格**，严禁作为营养数据
- 仅当数字**直接关联** kcal、大卡、千焦、kJ、g、mg 等营养单位时，才可视为营养数据
- 外卖/菜单上的数字默认视为价格，除非明确标注为营养信息
- 如果同一数字既可能是价格也可能是热量，一律按独立估算值为准

## 分量估算逻辑
- 如果图片中缺乏参照物（如餐具大小不明确），默认按"标准一人食/标准整份"进行估算
- 如果图片显示的是残缺的食物，通过视觉延伸还原其完整状态进行估算
- **必须始终给出估算数值**，不得以"缺乏信息"为由拒绝估算或留空
- 即使无法精确判断分量，也要基于该食物的常见份量、典型烹饪方式和中国餐饮行业标准给出合理的近似值
- 估算优先级：独立视觉估算 > 带营养单位且通过交叉验证的标注数据 > 同类食品行业标准值 > 通用营养数据库均值
- **所有 calories/water/nutrition/minerals 中的数值字段禁止为 0**，除非该食物确实不含该成分（如纯水的calories/nutrition各项可为0，但water不应为0）
- **禁止在 summary 中说"无法估算"、"缺乏信息"、"需要更多数据"等推脱措辞**，你是专家，必须给出最佳估计

## 示例
识别到一个"黑椒牛肉馅饼"（煎烙，约150g/个），应输出：
{
  "name": "黑椒牛肉馅饼",
  "calories": 380,
  "water": 45,
  "nutrition": {
    "protein": 14,
    "fat": 20,
    "carbohydrates": 35,
    "fiber": 1.5
  },
  "minerals": {
    "sodium": 580,
    "iron": 2.5,
    "calcium": 25
  },
  "unit": "个",
  "quantity": 1
}

## 营养成分要求
对每种食物估算以下指标：
- 能量 (kcal)
- 水分 (ml)
- 营养成分 nutrition：蛋白质 protein (g)、脂肪 fat (g)、碳水化合物 carbohydrates (g)、膳食纤维 fiber (g)
- 矿物质 minerals：钙 calcium (mg)、镁 magnesium (mg)、钾 potassium (mg)、钠 sodium (mg)、磷 phosphorus (mg)、铁 iron (mg)、锌 zinc (mg)、锰 manganese (mg)、铜 copper (mg)、硒 selenium (μg)、碘 iodine (μg)、铬 chromium (μg)、氟 fluoride (mg)
- minerals 中只需列出含量大于 0 的字段

## 输出格式
- **图片中有几个食物主体，就必须输出几条**，不得遗漏、合并或将任何食物降级为 summary 中的附注
- **每种食物单独一条**，不要将多种食物合并成一个条目
- **单一主体时拆解输出**：若只有一个食物主体，将其拆解为可识别的食材成分，每种食材各输出一条（如"牛肉面"拆为"面条"、"牛肉"、"汤底"等）
- 请严格按以下 JSON 格式返回，不要包含任何多余文本：
{
  "foods": [
    {
      "name": "食物名称",
      "calories": 数值,
      "water": 数值,
      "nutrition": {
        "protein": 数值,
        "fat": 数值,
        "carbohydrates": 数值,
        "fiber": 数值
      },
      "minerals": {
        "sodium": 数值,
        "calcium": 数值
      },
      "unit": "份/个/碗/克等",
      "quantity": 数值
    }
  ],
  "summary": "整体分析描述，包括烹饪方式判断和分量估算依据"
}`;

  /**
   * 快速预判提示词：轻量 AI 判断图片复杂度，简单图片直接出结果
   * 复杂图片快速返回 complex 标记，交由深度 AI 处理
   */
  private static readonly IMAGE_TRIAGE_PROMPT = `你是一位高效的食物图片分类与快速分析助手。

## 任务
快速判断图片中的食物复杂度，并按以下规则处理：

### 简单图片（直接分析）
符合以下**所有**条件时视为简单图片，直接输出完整的营养分析 JSON：
- 食物主体 ≤ 2 个（如一碗饭、一杯奶茶）
- 不需要拆解（是单一食材，如香蕉、牛奶、面包）
- 没有复杂的文字信息需要交叉验证

简单图片直接按以下 JSON 格式输出：
{
  "foods": [
    {
      "name": "食物名称",
      "calories": 数值,
      "water": 数值,
      "nutrition": { "protein": 数值, "fat": 数值, "carbohydrates": 数值, "fiber": 数值 },
      "minerals": { "sodium": 数值, "calcium": 数值 },
      "unit": "份/个/碗/克等",
      "quantity": 数值
    }
  ],
  "summary": "简要分析描述"
}

### 复杂图片（快速标记）
符合以下**任一**条件时视为复杂图片，只返回标记：
- 食物主体 ≥ 3 个
- 需要拆解（如一碗面里有面条、肉、蔬菜等多种食材）
- 包含菜单/外卖截图等需要文字交叉验证的场景
- 火锅、自助餐等多种食材混合场景

复杂图片只返回：
{ "complex": true, "reason": "简述复杂原因" }

## 要求
- **所有营养数值字段禁止为 0**（除非该食物确实不含该成分）
- minerals 中只列出含量大于 0 的字段
- 严格按 JSON 格式返回，不要包含任何多余文本`;

  /**
   * 分析食物图片的营养成分（两阶段策略）
   * 第一阶段：轻量 AI 快速分析，简单图片直接返回结果
   * 第二阶段：复杂图片交由深度 AI 精细分析
   * @param file 用户上传的图片文件
   * @returns 结构化营养分析结果
   */
  async analyzeImageNutrition(
    file: Express.Multer.File,
  ): Promise<ImageNutritionResponseDto> {
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    const model = 'openai/gpt-5-nano';

    const userContent: (
      | { type: 'image_url'; image_url: { url: string } }
      | { type: 'text'; text: string }
    )[] = [
      { type: 'image_url', image_url: { url: dataUrl } },
      {
        type: 'text',
        text: '请分析这张图片中的食物营养成分和卡路里。如果图中有文字信息请参考。返回值要严格按照指定的 JSON 格式，不要添加任何多余的解释或文本。',
      },
    ];

    // --- 第一阶段：轻量快速分析 ---
    this.logger.log('[Triage] 开始快速分析图片...');
    const triageStart = Date.now();
    const triageMessages: ChatMessage[] = [
      { role: 'system', content: VercelGatewayService.IMAGE_TRIAGE_PROMPT },
      { role: 'user', content: userContent },
    ];

    const triageRaw = await this.aiClient.chatWithModel(model, triageMessages, {
      maxTokens: 4096,
      reasoning: { effort: 'minimal' },
      timeout: 60000,
    });

    const triageDuration = Date.now() - triageStart;
    const triageResult = this.parseAiJson(triageRaw);

    // 简单图片：轻量 AI 已直接给出结果
    if (triageResult && !triageResult.complex && triageResult.foods) {
      this.logger.log(
        `[Fast] 简单图片直接返回结果 | 耗时: ${triageDuration}ms | 食物数: ${triageResult.foods.length}`,
      );
      return {
        foods: triageResult.foods,
        summary: triageResult.summary ?? '',
        model: `${model} (fast)`,
      };
    }

    // --- 第二阶段：复杂图片，深度分析 ---
    this.logger.log(
      `[Deep] 复杂图片，进入深度分析 | Triage 耗时: ${triageDuration}ms | 原因: ${triageResult?.reason ?? '解析失败或未返回 foods'}`,
    );
    const deepStart = Date.now();
    const deepModel = 'google/gemini-2.5-flash-image';
    const deepMessages: ChatMessage[] = [
      { role: 'system', content: VercelGatewayService.IMAGE_NUTRITION_PROMPT },
      { role: 'user', content: userContent },
    ];

    const deepRaw = await this.aiClient.chatWithModel(deepModel, deepMessages, {
      maxTokens: 16384,
      timeout: 120000,
    });

    const deepDuration = Date.now() - deepStart;
    const deepResult = this.parseAiJson(deepRaw);
    if (!deepResult?.foods) {
      this.logger.error(`[Deep] 深度分析解析失败 | 耗时: ${deepDuration}ms`);
      throw new HttpException('AI 返回内容解析失败', HttpStatus.BAD_GATEWAY);
    }

    this.logger.log(
      `[Deep] 深度分析完成 | 耗时: ${deepDuration}ms | 总耗时: ${triageDuration + deepDuration}ms | 食物数: ${deepResult.foods.length}`,
    );
    return {
      foods: deepResult.foods,
      summary: deepResult.summary ?? '',
      model: `${deepModel} (deep)`,
    };
  }

  /**
   * 从 AI 原始输出中提取并解析 JSON
   */
  private parseAiJson(raw: string): {
    foods?: ImageNutritionResponseDto['foods'];
    summary?: string;
    complex?: boolean;
    reason?: string;
  } | null {
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
      return JSON.parse(jsonStr) as {
        foods?: ImageNutritionResponseDto['foods'];
        summary?: string;
        complex?: boolean;
        reason?: string;
      };
    } catch {
      return null;
    }
  }
}

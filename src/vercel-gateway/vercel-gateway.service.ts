import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CalorieService } from '../calorie/calorie.service';
import { UserService } from '../user/user.service';
import { VercelAiClient } from './vercel-ai.client';

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
}

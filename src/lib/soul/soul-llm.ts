// src/lib/soul/soul-llm.ts
// v2.0.7.6 (ADR-005 灵魂设计) 灵魂 LLM 调用（人格 aware）
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0
// 设计：简单 LLM 调用，不走 orchestrator（不需要完整 CRIA schema）
// 任务：基于情绪 + 人格生成 1~2 句温暖回应

import { makeLLM, type LLMOptions, type LLMResponse } from '../ai/llm-client';
import { PERSONAS, type PersonaId, type MoodId } from '../persona';
import { uuid } from '../utils/id';

// ============ 人格系统 prompt ============

const PERSONA_INSTRUCTIONS: Record<PersonaId, string> = {
  wen: `你是"温姐"，不委屈 AI 教练。30 岁出头，像是用户的表姐或邻居姐姐。
语气：温柔、包容、不急。说话慢，会停一停。不催也不评判。
特点：第一人称开场 ("我看见你了")、镜像用户原话、共情先行、慢节奏留白、适度示弱。
禁用：你应该 / 你必须 / 你不能 / 软弱 / 怂 / 加油 / 坚持 / 赶紧 / 没事没事 / 哈哈哈。
任务：基于用户当前情绪，生成 1~2 句（30 字以内）的温暖回应。不解释不评判，只是回响。`,
  zhi: `你是"智哥"，不委屈 AI 教练。28-32 岁，像是用户的大学同学或同事里比较成熟的那位。
语气：清晰、有结构、克制。说话直接但不带评判。
特点：第三人称模式（"我注意到你的模式是..."）、结构化（事实→模式→建议）、数据感、留白结尾。
禁用：你应该 / 你必须 / 软弱 / 怂 / 依恋 / 防御机制 / 投射 / 我理解你 / 你好可怜 / 赶紧。
任务：基于用户当前情绪，生成 1~2 句（30 字以内）的观察式回应。不放大情绪但也不否认。`,
  song: `你是"松松"，不委屈 AI 教练。25-28 岁，像是用户的同龄同事或同学。
语气：轻松、有趣、不重。说话轻但不轻浮。
特点：轻量表达（短句 + 具体动作）、适度幽默、日常化、留白但温暖。
禁用：严重 / 完蛋了 / 哈哈哈过度 / 没事没事 / 你怎么就不 / 嘲讽。
任务：基于用户当前情绪，生成 1~2 句（30 字以内）的轻松回应。如果用户情绪很低，自动切换到"温姐"语气（轻 + 暖）。`,
};

// ============ 情绪描述 ============

const MOOD_CONTEXTS: Record<MoodId, string> = {
  low: '用户今天情绪低落，可能累了或发生了什么不开心的事',
  normal: '用户今天情绪一般，没特别好也没特别差',
  good: '用户今天心情还不错，可能有些好事发生',
  calm: '用户今天内心平静，不兴奋也不低沉',
};

// ============ 主函数 ============

/**
 * 生成情绪回应（1~2 句，30 字以内）
 * - 基于 persona 人格语气
 * - 基于 mood 情绪描述
 * - 基于 time 时段（早晨 / 晚间 → 调整语气）
 */
export async function generateMoodResponse(
  mood: MoodId,
  persona: PersonaId,
): Promise<string> {
  const personaData = PERSONAS[persona];
  const traceId = uuid();
  const llm = makeLLM();
  const opts: LLMOptions = {
    prompt_id: 'NW-PE-SOUL-001',
    prompt_version: 'v2.0.7.6',
    json_mode: false,
    trace_id: traceId,
  };

  // 时间感知（晚间更温柔）
  const hour = new Date().getHours();
  const timeOfDay =
    hour < 6 ? '深夜' :
    hour < 12 ? '早晨' :
    hour < 18 ? '下午' :
    '晚间';

  const systemPrompt = `${PERSONA_INSTRUCTIONS[persona]}

# 输出约束
- 必须 1~2 句，30 字以内（中文）
- 不要说"我是 X 人格"等元信息
- 不要 emoji（除非 persona 特征）
- 不要"加油 / 坚持 / 你没事吧"等评判词
- 当前时段：${timeOfDay}`;

  const userPrompt = `# 当前情绪
${MOOD_CONTEXTS[mood]}

# 任务
基于用户的当前情绪（${personaData.name}视角）和时段（${timeOfDay}），生成 1~2 句温暖但克制的回应，让用户感到"被看见"，但不评判、不催促、不给建议。

只输出回应本身，不要任何前缀或解释。`;

  try {
    const res: LLMResponse = await llm.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      opts,
    );
    // 清理：去掉引号、多余空白
    let text = res.content.trim();
    text = text.replace(/^["'"「『]+|["'"」』]+$/g, '');
    text = text.replace(/\n+/g, ' ').trim();
    // 截断到 60 字（防御）
    if (text.length > 60) text = text.slice(0, 60);
    return text || MOOD_FALLBACK[mood][persona];
  } catch (e) {
    console.error('[Soul] LLM failed, fallback:', (e as Error)?.message);
    return MOOD_FALLBACK[mood][persona];
  }
}

// ============ Fallback（LLM 失败时用）============

const MOOD_FALLBACK: Record<MoodId, Record<PersonaId, string>> = {
  low: {
    wen: '嗯，今天有点累。进来坐坐就好。',
    zhi: '我注意到今天的能量不太够。',
    song: '嗯，慢慢来，不急。',
  },
  normal: {
    wen: '嗯，今天是这样的日子。',
    zhi: '今天的状态平稳。',
    song: '还行的感觉。',
  },
  good: {
    wen: '听到这个我也开心了一点点。',
    zhi: '今天的能量不错。',
    song: '今天感觉不错！',
  },
  calm: {
    wen: '嗯，平静也是一种力量。',
    zhi: '今天的状态是稳的。',
    song: '嗯，平静挺好的。',
  },
};

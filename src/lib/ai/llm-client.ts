// src/lib/ai/llm-client.ts
// LLM 抽象层：Mock + OpenAI 兼容 Http + 主备路由 + 兜底
// 来自 docs/03-System-Architecture.md §6.3
//
// 切换供应商：设 LLM_PROVIDER=openai + LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
// 主备路由：再设 LLM_BASE_URL_BACKUP / LLM_API_KEY_BACKUP

import { uuid } from '../utils/id';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  prompt_id: string;
  prompt_version: string;
  trace_id: string;
  token_in: number;
  token_out: number;
}

export interface LLMOptions {
  prompt_id: string;
  prompt_version: string;
  temperature?: number;
  json_mode?: boolean;
  trace_id?: string;
}

export interface LLMClient {
  chat(messages: ChatMessage[], opts: LLMOptions): Promise<LLMResponse>;
}

// ============== HttpLLM（OpenAI 兼容协议） ==============

interface HttpLLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

function redactKey(key: string): string {
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export class HttpLLM implements LLMClient {
  constructor(private config: HttpLLMConfig) {}

  async chat(messages: ChatMessage[], opts: LLMOptions): Promise<LLMResponse> {
    const trace_id = opts.trace_id ?? uuid();
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: 4000, // 给 M3 思考 + JSON 输出留够预算
      stream: false,
    };
    if (opts.json_mode) {
      body.response_format = { type: 'json_object' };
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'Accept-Encoding': 'identity',
          Connection: 'close', // 避免长连接被中间设备重置
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (e: any) {
      throw new Error(`LLM network error: ${e?.message ?? 'unknown'} (url=${this.config.baseUrl}, key=${redactKey(this.config.apiKey)})`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 200)} (url=${this.config.baseUrl}, key=${redactKey(this.config.apiKey)})`);
    }

    const data: any = await res.json();
    const choice = data?.choices?.[0];
    let content = choice?.message?.content ?? '';

    // 检测内容是否被截断（JSON 未闭合）
    const finishReason = choice?.finish_reason;
    const looksTruncated =
      opts.json_mode &&
      content.length > 50 &&
      finishReason === 'length' && // M3 用 'length' 表示被 max_tokens 截断
      !content.trim().endsWith('}') &&
      !content.trim().endsWith('```');

    if (looksTruncated) {
      // 自动重试一次，加大 max_tokens
      console.warn('[HttpLLM] response truncated, retrying with larger max_tokens');
      const retryBody = { ...body, max_tokens: 8000 };
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'Accept-Encoding': 'identity',
          Connection: 'close',
        },
        body: JSON.stringify(retryBody),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      if (retryRes.ok) {
        const retryData: any = await retryRes.json();
        const retryChoice = retryData?.choices?.[0];
        const retryContent = retryChoice?.message?.content ?? '';
        if (retryContent.length > content.length) {
          content = retryContent;
        }
      }
    }

    if (!content) {
      console.error('[HttpLLM] EMPTY response. data=', JSON.stringify(data).slice(0, 500));
      throw new Error(`LLM empty response: ${JSON.stringify(data).slice(0, 200)}`);
    }

    return {
      content,
      model: data.model ?? this.config.model,
      prompt_id: opts.prompt_id,
      prompt_version: opts.prompt_version,
      trace_id,
      token_in: data.usage?.prompt_tokens ?? 0,
      token_out: data.usage?.completion_tokens ?? 0,
    };
  }
}

// ============== 主备 Failover ==============

export class FailoverLLM implements LLMClient {
  constructor(private primary: LLMClient, private backup: LLMClient) {}

  async chat(messages: ChatMessage[], opts: LLMOptions): Promise<LLMResponse> {
    try {
      return await this.primary.chat(messages, opts);
    } catch (e: any) {
      console.warn(`[LLM] primary failed: ${e?.message ?? e}, trying backup`);
      try {
        return await this.backup.chat(messages, opts);
      } catch (e2: any) {
        console.error(`[LLM] backup also failed: ${e2?.message ?? e2}`);
        throw e2;
      }
    }
  }
}

// ============== Mock（多模板池 + 上下文感知） ==============

type Pattern = '取悦' | '压抑' | '回避' | '攻击' | '危机' | '其他';

interface ReplyTemplate {
  acknowledge: string[];
  name_it: string[];
  need: string[];
  try_this: string[];
  next_step: string[];
}

const REPLY_POOLS: Record<Pattern, ReplyTemplate> = {
  取悦: {
    acknowledge: [
      '听上去你已经很累了。',
      '被这样对待，你一定不好受。',
      '嗯，这种事最磨人。',
      '你心里大概压了挺久。',
      '听起来挺让人难受的。',
      '光听着就替你累。',
      '你一直在硬撑。',
    ],
    name_it: [
      '你想说"不"，但话到嘴边又咽回去了。',
      '你其实知道该怎么做，但怕说出来破坏关系。',
      '你在意对方，但也不想一直这样忍下去。',
      '你的"应该"和你的"想"正在打架。',
      '你心里其实有答案，只是需要一个出口。',
      '你担心的是"我不够好"，但其实你只是在保护自己。',
      '你在等的，不是"被允许说不"，是"被允许有自己的节奏"。',
    ],
    need: [
      '你需要的是被尊重的时间。',
      '你需要的不是"拒绝的方法"，是"被看见"。',
      '你想被允许有自己的节奏。',
      '你不需要讨好所有人。',
      '你需要的是不内耗。',
      '你需要的是"这件事可以不属于我"。',
    ],
    try_this: [
      '你可以试一句：「今晚我有安排了，剩下的明天上午我处理。」',
      '「这周末我已经有安排了，如果项目急，我们看看哪些必须今天做。」',
      '「我自己的活还没收尾，下次早点说，我看看能不能帮上忙。」',
      '「这件事我得先想一下，半小时后给你答复。」',
      '「我愿意帮你看，但我得先把我自己的事做完。」',
      '「我听到了，我需要半小时再回复你。」',
      '「今晚我有安排。如果你今天非要这个，我明天上午第一时间给你。」',
    ],
    next_step: [
      '这句话如果说出来，你最担心的是什么？',
      '如果不说出来，下周一你会怎么想？',
      '你想先练一下，还是想再多说说刚才发生了什么？',
      '你愿不愿意告诉我，如果答应了，最坏的结果是什么？',
      '现在不说也行，我们先聊聊。',
      '你愿意先从哪一句开始试？',
    ],
  },
  压抑: {
    acknowledge: ['你一直在压着。', '能感觉到你在扛很多。', '这种"先不说"的感觉不好受。', '你一直没说出口吧。'],
    name_it: [
      '你不是没有想法，你只是没给自己说出来的空间。',
      '你担心说出来"破坏气氛"，于是把话咽了回去。',
      '你在用"没事"挡掉所有需要表达的。',
    ],
    need: [
      '你需要的是被允许说"我不好"。',
      '你需要的不是"忍住"，是"被听见"。',
      '你想有一个出口，哪怕只是被听到。',
    ],
    try_this: [
      '你可以试着写下来，不用给任何人看。',
      '或者你可以先只对自己说："我其实很累。"',
      '试试在手机备忘录里写一段，不超过 50 字。',
    ],
    next_step: ['你愿意先写一段吗？', '如果现在说不出来，写下来也可以。', '你想先说说哪一段？'],
  },
  回避: {
    acknowledge: ['你下意识地想躲开。', '面对这件事，你第一反应是"算了"。', '你累了，宁可绕路也不想正面碰。'],
    name_it: [
      '你不是在逃避问题，是在逃避"冲突"。',
      '你担心一旦面对，关系会变。',
      '你宁愿"不解决"，也不想"吵起来"。',
    ],
    need: [
      '你需要的是"不吵也能解决"的路径。',
      '你想被看见，但你不想被攻击。',
      '你需要的是"先被听见，再谈事"。',
    ],
    try_this: [
      '你可以先发一条文字，把"我想跟你谈一件事，但不想吵"发出去。',
      '「我有个想法，想找时间跟你聊聊，你什么时候方便？」',
      '你可以把要说的写在纸上，先给 ta 看，不直接开口。',
    ],
    next_step: ['你愿意用文字先开口吗？', '你想用哪种方式"间接"先说？', '现在如果让你选，最不让你害怕的方式是什么？'],
  },
  攻击: {
    acknowledge: ['被甩脸色，又帮了他，这真的会让人生气。', '你的愤怒里其实是被当成工具。', '你不该被这样对待。'],
    name_it: [
      '你的愤怒背后，是想被当作一个人看到，不是工具。',
      '你想被尊重，也想被善待。',
      '你不是在"想骂人"，你是在"想被看见"。',
    ],
    need: ['你想被尊重。', '你想被善待。', '你不想再"白干"。'],
    try_this: [
      '你可以说一句：「我帮了你，我希望能被当回事。下次请早一点说。」',
      '「我可以帮忙，但我需要你尊重我的时间。」',
      '「我愿意帮，但请别用这种态度。」',
    ],
    next_step: ['说完这句之后，你最担心什么？', '你愿意先练一遍吗？', '如果 ta 当时回了一句冷话，你打算怎么接？'],
  },
  危机: { acknowledge: [], name_it: [], need: [], try_this: [], next_step: [] },
  其他: {
    acknowledge: ['我在这。', '嗯，我听到了。', '你刚才那句话我没太接住。'],
    name_it: ['想再跟我说说吗？', '可以慢慢来。', '不急。'],
    need: ['', '', ''],
    try_this: ['', '', ''],
    next_step: ['想从哪开始都行，或者我们就先随便聊聊。', '可以只说一点点。', '你现在想被听，还是想被回应？'],
  },
};

const LATE_TURN_POOLS: ReplyTemplate = {
  acknowledge: ['嗯。', '听到了。', '我在这。', '好。'],
  name_it: [
    '你刚才说的那个担心，我记着。',
    '这件事对你来说是真的。',
    '你能说出来，已经很不容易。',
  ],
  need: ['你不需要马上决定。', '你愿意的话，先把刚才那句再说一次。'],
  try_this: ['再说一次给我听？', '你愿意把刚才那句话，用第一人称再说一遍吗？'],
  next_step: ['这次不练也行。', '你愿意继续，还是先停？'],
};

function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) return '' as T;
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MockLLM implements LLMClient {
  async chat(messages: ChatMessage[], opts: LLMOptions): Promise<LLMResponse> {
    const sys = messages.find((m) => m.role === 'system')?.content ?? '';
    const userPayload = safeJson(messages.find((m) => m.role === 'user')?.content ?? '{}');
    const trace_id = opts.trace_id ?? uuid();

    let content = '{}';
    if (sys.includes('分析者')) {
      content = mockAnalyze((userPayload as any).user_input || '');
    } else if (sys.includes('回复') || sys.includes('CRIA')) {
      content = mockReply(userPayload as any);
    }
    return {
      content,
      model: 'mock-template-pool-v2',
      prompt_id: opts.prompt_id,
      prompt_version: opts.prompt_version,
      trace_id,
      token_in: JSON.stringify(messages).length,
      token_out: content.length,
    };
  }
}

function mockAnalyze(input: string): string {
  const isCrisis = /不想活|想消失|撑不下去|想死|家暴|被跟踪/.test(input);
  if (isCrisis) {
    return JSON.stringify({
      facts: ['用户表达危机信号'],
      emotions: ['绝望', '无力'],
      needs: ['安全感', '被接住'],
      pattern: '危机',
      layer: 'L4',
      risk: 'crisis',
      crisis_signals: ['自伤念头'],
      confidence: 0.9,
      note: '立即停主线，走危机兜底。',
    });
  }
  if (/又让我|又要我|又让我帮|甩活|加班|催/.test(input)) {
    return JSON.stringify({
      facts: ['用户被请求 / 越界'],
      emotions: ['委屈', '内疚'],
      needs: ['被尊重的时间', '拒绝的空间'],
      pattern: '取悦',
      layer: 'L3',
      risk: 'low',
      crisis_signals: [],
      confidence: 0.85,
      note: '用户已意识到模式，卡在表达。',
    });
  }
  if (/生气|愤怒|滚|烦死/.test(input)) {
    return JSON.stringify({
      facts: ['用户表达愤怒'],
      emotions: ['愤怒', '受伤'],
      needs: ['被尊重', '被善待'],
      pattern: '攻击',
      layer: 'L3',
      risk: 'med',
      crisis_signals: [],
      confidence: 0.8,
      note: '不参与辱骂，先接住愤怒。',
    });
  }
  if (/不想说|算了|随便|懒得/.test(input)) {
    return JSON.stringify({
      facts: ['用户想回避'],
      emotions: ['疲惫'],
      needs: ['不被打扰'],
      pattern: '回避',
      layer: 'L2',
      risk: 'low',
      crisis_signals: [],
      confidence: 0.7,
      note: '尊重用户节奏，不催继续。',
    });
  }
  return JSON.stringify({
    facts: [],
    emotions: ['unknown'],
    needs: ['unknown'],
    pattern: '其他',
    layer: 'L1',
    risk: 'low',
    crisis_signals: [],
    confidence: 0.4,
    note: '输入不明确，温和邀请补充。',
  });
}

function mockReply(payload: any): string {
  const { analyze, context = {}, kb_refs = [] } = payload;

  if (analyze?.risk === 'crisis') {
    return JSON.stringify({
      acknowledge: '',
      name_it: '',
      need: '',
      try_this: '',
      next_step: '',
      tone: 'calm_warm',
      word_count: 0,
      meta: { should_continue: false, fallback: 'crisis_redirect', kb_refs: [] },
    });
  }

  const pattern: Pattern = analyze?.pattern || '其他';
  const turnCount: number = context.turn_count || 1;
  const isLate = turnCount >= 6;

  const pool = isLate ? LATE_TURN_POOLS : (REPLY_POOLS[pattern] || REPLY_POOLS.其他);

  const acknowledge = pickRandom(pool.acknowledge);
  const name_it = pickRandom(pool.name_it);
  const need = pickRandom(pool.need);
  const try_this = pickRandom(pool.try_this);
  const next_step = pickRandom(pool.next_step);

  const hour = context.hour_local ?? new Date().getHours();
  const isLateNight = hour >= 22 || hour < 6;
  const tone = isLateNight ? 'calm_brief' : 'calm_warm';

  const kbIds = Array.isArray(kb_refs)
    ? kb_refs.slice(0, 3).map((k: any) => (typeof k === 'string' ? k : k.id)).filter(Boolean)
    : [];

  const allText = [acknowledge, name_it, need, try_this, next_step].join('');
  let word_count = allText.length;
  if (word_count > 150) word_count = 150;

  const should_continue = !isLate;

  return JSON.stringify({
    acknowledge,
    name_it,
    need,
    try_this,
    next_step,
    tone,
    word_count,
    meta: { should_continue, fallback: null, kb_refs: kbIds },
  });
}

function safeJson(text: string): unknown {
  try {
    // 1. 去掉 markdown 代码块标记
    let cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();
    // 2. 去掉 <think>...</think> 推理块（MiniMax-M3 特性）
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // 3. 提取第一个 JSON 对象 / 数组
    const objStart = cleaned.indexOf('{');
    const arrStart = cleaned.indexOf('[');
    let start = -1;
    if (objStart === -1) start = arrStart;
    else if (arrStart === -1) start = objStart;
    else start = Math.min(objStart, arrStart);
    if (start > 0) cleaned = cleaned.slice(start);
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

export { safeJson };

// ============== 工厂 ==============

export function makeLLM(): LLMClient {
  const provider = process.env.LLM_PROVIDER || 'mock';
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS) || 30000;

  if (provider === 'openai' || provider === 'openai-failover') {
    const primaryKey = process.env.LLM_API_KEY;
    const primaryUrl = process.env.LLM_BASE_URL;
    const primaryModel = process.env.LLM_MODEL || 'MiniMax-M3';

    if (!primaryKey) {
      console.warn('[LLM] LLM_API_KEY 未设置，降级到 Mock');
      return new MockLLM();
    }
    if (!primaryUrl) {
      console.warn('[LLM] LLM_BASE_URL 未设置，降级到 Mock');
      return new MockLLM();
    }

    const primary = new HttpLLM({
      baseUrl: primaryUrl,
      apiKey: primaryKey,
      model: primaryModel,
      timeoutMs,
    });

    if (provider === 'openai-failover') {
      const backupKey = process.env.LLM_API_KEY_BACKUP;
      const backupUrl = process.env.LLM_BASE_URL_BACKUP;
      if (backupKey && backupUrl) {
        const backup = new HttpLLM({
          baseUrl: backupUrl,
          apiKey: backupKey,
          model: process.env.LLM_MODEL_BACKUP || primaryModel,
          timeoutMs,
        });
        return new FailoverLLM(primary, backup);
      }
    }

    return primary;
  }

  return new MockLLM();
}

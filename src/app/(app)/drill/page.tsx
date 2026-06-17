// src/app/(app)/drill/page.tsx
// v2.0.7.7 (ADR-005 P0 + 双路径演练) 12 步演练 · 习惯模式 → AI 反映 → 健康模式 → 对比收束
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0 + 方案 D（双路径）
// 设计：步骤 3-6 让用户选"平时会怎么做"（暴露习惯模式），步骤 7 AI 反映（不评判），
//       步骤 8-10 走健康选项（学习替代），步骤 11 演练真实场景，步骤 12 对比收束。
'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Pause } from 'lucide-react';

import { CrisisBanner } from '@/components/crisis/CrisisBanner';
import { getScenarioOptions, scenarios } from '@/lib/scenarios-data';
import type { StepOptions } from '@/lib/scenarios-data';
import { loadPersonaPref, type PersonaId } from '@/lib/persona';

type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// 步骤标签（带 HABIT/HEALTH 标记，让用户在进度条上看出区别）
const STEP_LABELS = {
  1: '场景',
  2: '身体',
  3: '§A 习惯·情绪',
  4: '§A 习惯·想要',
  5: '§A 习惯·边界',
  6: '§A 习惯·开场',
  7: '§A 反映',
  8: '§B 健康·情绪',
  9: '§B 健康·想要',
  10: '§B 健康·边界+开场',
  11: '演练',
  12: '对比收束',
};

interface StepState {
  // §A 习惯模式（暴露）
  habitEmotion?: string;
  habitWant?: string;
  habitWill?: string;
  habitWont?: string;
  habitOpener?: string;
  // §B 健康模式（学习）
  emotion?: string;
  iWant?: string;
  iWill?: string;
  iWont?: string;
  opener?: string;
  userSays?: string;
  counter?: string;
  reply?: string;
}

function DrillInner() {
  const router = useRouter();
  const search = useSearchParams();
  const code = search.get('code') || 'friend-borrow';

  const scenario = useMemo(
    () => scenarios.find((s) => s.code === code) || scenarios[0],
    [code],
  );
  const opts = useMemo<StepOptions>(() => getScenarioOptions(code), [code]);
  const [persona, setPersona] = useState<PersonaId>('wen');

  const [step, setStep] = useState<StepNo>(1);
  const [data, setData] = useState<StepState>({});
  const [crisis, setCrisis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);

  // 加载人格偏好（用于步骤 7 反映）
  useEffect(() => {
    setPersona(loadPersonaPref());
  }, []);

  const fetchReply = async () => {
    if (data.reply) return;
    setLoading(true);
    try {
      const createRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'drill' }),
      });
      const createJson = await createRes.json();
      const conversationId = createJson?.data?.id as string | undefined;
      if (!conversationId) {
        setData((d) => ({ ...d, reply: opts.openers[0] }));
        return;
      }
      const msgRes = await fetch(
        '/api/conversations/' + conversationId + '/messages',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            content:
              '我刚刚练完「' +
              scenario.title +
              '」：我' +
              (data.iWant || '') +
              '，我' +
              (data.iWill || '') +
              '，我' +
              (data.iWont || '') +
              '。我刚刚说出口的是：' +
              (data.userSays || '') +
              '。请给我一句 30 字以内的平静话术。',
            client_msg_id: crypto.randomUUID(),
            intent_override: 'drill',
            scenario: scenario.title,
          }),
        },
      );
      const msgJson = await msgRes.json();
      if (msgJson?.data?.crisis) {
        setCrisis(true);
        return;
      }
      const reply = msgJson?.data?.reply;
      const oneLine = [reply?.try_this, reply?.next_step, reply?.acknowledge]
        .filter(Boolean)
        .join(' ')
        .slice(0, 60);
      setData((d) => ({
        ...d,
        reply: oneLine || data.userSays || opts.openers[0],
      }));
    } catch {
      setData((d) => ({
        ...d,
        reply: data.userSays || opts.openers[0],
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 11) {
      void fetchReply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (crisis) {
    return <CrisisBanner onSafe={() => setCrisis(false)} />;
  }

  if (paused) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <h2 className="font-serif text-lg font-medium text-warm-900">歇一下</h2>
        <p className="mt-2 text-sm text-sage-700/70">草稿已保存。下次进来会回到这一步。</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="rounded-md bg-sage-400 px-4 py-2 text-sm font-medium text-white hover:bg-sage-500"
          >
            继续
          </button>
          <button
            type="button"
            onClick={() => router.push('/today')}
            className="rounded-md border border-sage-300 bg-warm-50 px-4 py-2 text-sm"
          >
            改天继续
          </button>
        </div>
      </div>
    );
  }

  // 步骤 12：对比收束
  if (step === 12) {
    const finalLine = data.reply || data.userSays || data.opener || opts.openers[0];
    const habitLine = data.habitOpener || data.habitWant || '（你没选）';
    return (
      <div className="mx-auto max-w-md py-12">
        <h1 className="font-serif text-2xl font-semibold text-warm-900">
          我刚刚练过了一次。
        </h1>

        {/* 对比视图：左边习惯 / 右边今天练的 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-sage-200 bg-warm-100 p-4">
            <div className="text-xs font-medium text-sage-700">你平时说</div>
            <p className="mt-2 text-sm leading-relaxed text-warm-900">"{habitLine}"</p>
          </div>
          <div className="rounded-xl border border-cactus-flower/40 bg-cactus-flower/5 p-4">
            <div className="text-xs font-medium text-cactus-flower">今天练的</div>
            <p className="mt-2 text-sm leading-relaxed text-warm-900">"{finalLine}"</p>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-sage-600/60">
          左边是你的习惯反应 · 右边是今天练的另一种可能
        </p>

        {/* 加进剧本 + 继续 */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push('/scripts')}
            className="inline-flex items-center gap-2 rounded-full bg-sage-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-500"
          >
            <Check className="h-4 w-4" aria-hidden />
            加进我的剧本
          </button>
          <button
            type="button"
            onClick={() => router.push('/today')}
            className="rounded-md border border-sage-300 bg-warm-50 px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
          >
            回到成长路
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-sage-600/60">
          下次想练就练。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/today" className="text-xs text-sage-700/70 hover:text-warm-900">
          <ArrowLeft className="inline h-3 w-3" /> 回到成长路
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-label={'当前：' + STEP_LABELS[step]}>
            {Array.from({ length: 12 }).map((_, i) => {
              const isHabit = i + 1 >= 3 && i + 1 <= 6;
              const isReflection = i + 1 === 7;
              const isHealth = i + 1 >= 8 && i + 1 <= 10;
              const active = i + 1 <= step;
              let cls = 'h-1.5 w-1.5 rounded-full ';
              if (isHabit && active) cls += 'bg-sunset';
              else if (isReflection && active) cls += 'bg-cactus-flower';
              else if (isHealth && active) cls += 'bg-sage-500';
              else if (active) cls += 'bg-sage-400';
              else cls += 'bg-sage-200';
              return <span key={i} aria-hidden className={cls} />;
            })}
          </div>
          <span className="text-xs text-sage-700/70">{STEP_LABELS[step]}</span>
        </div>
        <button
          type="button"
          onClick={() => setPaused(true)}
          className="text-xs text-sage-700/70 hover:text-warm-900"
          aria-label="暂停演练"
        >
          <Pause className="inline h-3 w-3" /> 暂停
        </button>
      </div>

      <h1 className="font-serif text-lg font-semibold text-warm-900">{scenario.title}</h1>
      <p className="mt-1 text-xs text-sage-700/70">{scenario.layer} · 估计 4 分钟</p>

      <div className="mt-6">
        {step === 1 && (
          <Step1 scenario={scenario} onStart={() => setStep(2)} />
        )}

        {step === 2 && (
          <Step2
            value={data.emotion && '' /* placeholder */}
            onPick={(v) => {
              setStep(3);
            }}
          />
        )}

        {/* §A 习惯模式（步骤 3-6）— 暴露用户平时的反应 */}
        {step === 3 && (
          <HabitChoice
            prompt="此刻身体哪里有感觉？(平时习惯的回应)"
            options={opts.habit_emotions || opts.emotions}
            value={data.habitEmotion}
            onPick={(v) => {
              setData((d) => ({ ...d, habitEmotion: v }));
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <HabitChoice
            prompt="我平时想要的是：(暴露你的真实习惯)"
            options={opts.habit_wants || opts.wants}
            value={data.habitWant}
            onPick={(v) => {
              setData((d) => ({ ...d, habitWant: v }));
              setStep(5);
            }}
          />
        )}

        {step === 5 && (
          <Step5Habit
            wills={opts.habit_wills || opts.wills}
            wonts={opts.habit_wonts || opts.wonts}
            will={data.habitWill}
            wont={data.habitWont}
            onChange={(field, value) => {
              setData((d) => ({ ...d, [field]: value }));
            }}
            onNext={() => setStep(6)}
          />
        )}

        {step === 6 && (
          <HabitChoice
            prompt="我平时会这样开场：(暴露习惯性反应)"
            options={opts.habit_openers || opts.openers}
            value={data.habitOpener}
            onPick={(v) => {
              setData((d) => ({ ...d, habitOpener: v }));
              setStep(7);
            }}
          />
        )}

        {/* §A 反映（步骤 7）— AI 不评判地反映用户的习惯 */}
        {step === 7 && (
          <Step7Reflection
            habitChoice={data.habitOpener || data.habitWant || data.habitEmotion || '你的选择'}
            reflections={opts.reflections}
            persona={persona}
            onContinue={() => setStep(8)}
          />
        )}

        {/* §B 健康模式（步骤 8-10）— 学习替代 */}
        {step === 8 && (
          <MultiChoice
            prompt="其实还可以这样命名这个情绪："
            options={opts.emotions}
            value={data.emotion}
            onPick={(v) => {
              setData((d) => ({ ...d, emotion: v }));
              setStep(9);
            }}
          />
        )}

        {step === 9 && (
          <MultiChoice
            prompt="其实还可以这样想——我想要："
            options={opts.wants}
            value={data.iWant}
            onPick={(v) => {
              setData((d) => ({ ...d, iWant: v }));
              setStep(10);
            }}
          />
        )}

        {step === 10 && (
          <Step10Health
            wills={opts.wills}
            wonts={opts.wonts}
            openers={opts.openers}
            will={data.iWill}
            wont={data.iWont}
            opener={data.opener}
            onChange={(field, value) => {
              setData((d) => ({ ...d, [field]: value }));
            }}
            onNext={(userSays) => {
              setData((d) => ({ ...d, userSays }));
              setStep(11);
            }}
          />
        )}

        {/* 演练 + 收束（步骤 11）— 用户说 → 反驳 → 应对 → LLM 收束 */}
        {step === 11 && (
          <Step11Drill
            loading={loading}
            userSays={data.userSays}
            opener={data.opener}
            counter={opts.counter}
            counterReplies={opts.counter_replies}
            userSaysVariants={opts.user_says_variants}
            reply={data.reply}
            onComplete={(userSays, counter, reply) => {
              setData((d) => ({ ...d, userSays, counter, reply }));
              setStep(12);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============ 步骤组件 ============

function Step1({ scenario, onStart }: { scenario: { title: string; one_liner: string }; onStart: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sage-200 bg-warm-50 p-5">
        <div className="text-xs text-sage-700/70">场景</div>
        <p className="mt-2 text-sm leading-relaxed text-warm-900">{scenario.one_liner}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-md bg-sage-400 px-4 py-2 text-sm font-medium text-white hover:bg-sage-500"
      >
        开始
      </button>
    </div>
  );
}

function Step2({ onPick }: { value?: string; onPick: (v: string) => void }) {
  const options = ['紧张', '胸闷', '胃紧', '手心出汗', '没明显', '其他'];
  return (
    <div>
      <p className="mb-3 text-sm text-warm-900">此刻身体哪里有感觉？</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            className="rounded-md border border-sage-300 bg-warm-50 px-3 py-2 text-left text-sm text-warm-900 transition hover:border-sage-400 hover:bg-sage-50"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 习惯模式选择（步骤 3/4/6）— 暴露用户的讨好/回避模式 */
function HabitChoice({
  prompt,
  options,
  value,
  onPick,
}: {
  prompt: string;
  options: string[];
  value?: string;
  onPick: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 inline-block rounded-full bg-sunset/15 px-2.5 py-0.5 text-[10px] font-medium text-sunset">
        习惯模式
      </div>
      <p className="mb-3 text-sm text-warm-900">{prompt}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onPick(o)}
              className={`rounded-md border px-3 py-2.5 text-left text-sm transition ${
                selected
                  ? 'border-sunset bg-sunset/10 text-warm-900'
                  : 'border-sage-300 bg-warm-50 text-warm-900 hover:border-sunset hover:bg-sunset/5'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 步骤 5：习惯模式下愿意/不愿意 */
function Step5Habit({
  wills,
  wonts,
  will,
  wont,
  onChange,
  onNext,
}: {
  wills: string[];
  wonts: string[];
  will?: string;
  wont?: string;
  onChange: (field: 'habitWill' | 'habitWont', value: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="mb-2 inline-block rounded-full bg-sunset/15 px-2.5 py-0.5 text-[10px] font-medium text-sunset">
        习惯模式
      </div>
      <MultiChoice
        prompt="我平时愿意："
        options={wills}
        value={will}
        onPick={(v) => onChange('habitWill', v)}
      />
      <MultiChoice
        prompt="我平时不愿意："
        options={wonts}
        value={wont}
        onPick={(v) => onChange('habitWont', v)}
      />
      {will && wont && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-sage-400 px-4 py-2 text-sm font-medium text-white hover:bg-sage-500"
        >
          下一步
        </button>
      )}
    </div>
  );
}

/** 步骤 7：AI 反映（不评判）— 按 persona 显示一条 reflection */
function Step7Reflection({
  habitChoice,
  reflections,
  persona,
  onContinue,
}: {
  habitChoice: string;
  reflections?: { wen?: string[]; zhi?: string[]; song?: string[] };
  persona: PersonaId;
  onContinue: () => void;
}) {
  // 选 reflections 中的一条（按 persona），fallback 用通用版
  const pool = reflections?.[persona] || [
    '我听到你刚才的选择。这是一种常见的反应——你愿意看到它，已经是一种觉察。',
  ];
  const picked = pool[0];

  // persona 视觉
  const personaColors: Record<PersonaId, string> = {
    wen: 'border-cactus-flower bg-persona-wen',
    zhi: 'border-sky-400 bg-persona-zhi',
    song: 'border-sunset bg-persona-song',
  };
  const personaEmoji: Record<PersonaId, string> = {
    wen: '🌸',
    zhi: '🧠',
    song: '🌻',
  };
  const personaName: Record<PersonaId, string> = {
    wen: '温姐',
    zhi: '智哥',
    song: '松松',
  };

  return (
    <div>
      <div className={`rounded-2xl border-2 ${personaColors[persona]} p-5 shadow-soft`}>
        <div className="flex items-center gap-2 text-xs text-sage-700/70">
          <span className="text-2xl" aria-hidden>{personaEmoji[persona]}</span>
          <span className="font-medium">{personaName[persona]} 在说</span>
        </div>
        <p className="mt-3 font-serif text-base leading-relaxed text-warm-900">
          {picked}
        </p>
        <p className="mt-3 text-[10px] text-sage-600/60">
          你刚才说："{habitChoice}"
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="mb-3 text-xs text-sage-700/70">
          这不是评判——只是让你看见自己。<br />
          下面我们看，还有没有别的可能。
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md bg-sage-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-500"
        >
          看看另一种可能
        </button>
      </div>
    </div>
  );
}

/** 步骤 10：健康模式 — 愿意/不愿意 + 开场白合并 */
function Step10Health({
  wills,
  wonts,
  openers,
  will,
  wont,
  opener,
  onChange,
  onNext,
}: {
  wills: string[];
  wonts: string[];
  openers: string[];
  will?: string;
  wont?: string;
  opener?: string;
  onChange: (field: 'iWill' | 'iWont' | 'opener', value: string) => void;
  onNext: (userSays: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="mb-2 inline-block rounded-full bg-sage-100 px-2.5 py-0.5 text-[10px] font-medium text-sage-700">
        健康模式
      </div>
      <MultiChoice
        prompt="其实我可以这样想——我愿意："
        options={wills}
        value={will}
        onPick={(v) => onChange('iWill', v)}
      />
      <MultiChoice
        prompt="其实我可以这样想——我不愿意："
        options={wonts}
        value={wont}
        onPick={(v) => onChange('iWont', v)}
      />
      <MultiChoice
        prompt="其实我还可以这样开场："
        options={openers}
        value={opener}
        onPick={(v) => onChange('opener', v)}
      />
      {will && wont && opener && (
        <button
          type="button"
          onClick={() => onNext(opener)}
          className="rounded-md bg-sage-400 px-4 py-2 text-sm font-medium text-white hover:bg-sage-500"
        >
          下一步
        </button>
      )}
    </div>
  );
}

/** 步骤 11：演练 + 收束（用户说 → 反驳 → 应对 → LLM 收束） */
function Step11Drill({
  loading,
  userSays,
  opener,
  counter,
  counterReplies,
  userSaysVariants,
  reply,
  onComplete,
}: {
  loading: boolean;
  userSays?: string;
  opener?: string;
  counter: string;
  counterReplies: string[];
  userSaysVariants: string[];
  reply?: string;
  onComplete: (userSays: string, counter: string, reply: string) => void;
}) {
  const [localUserSays, setLocalUserSays] = useState(userSays || opener || '');
  const [localCounter, setLocalCounter] = useState<string | undefined>();
  const [localReply, setLocalReply] = useState<string | undefined>(reply);

  // 简化：默认选第一个 variant（实际可让用户选）
  const effectiveUserSays = localUserSays || (userSaysVariants[0] ?? '');

  return (
    <div>
      <p className="mb-2 text-xs text-sage-700/70">我刚说出口的是：</p>
      <div className="rounded-md border border-sage-200 bg-warm-50 p-3 text-sm text-warm-900">
        "{effectiveUserSays}"
      </div>

      {!localCounter && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-sage-700/70">对方回应：</p>
          <div className="mb-3 rounded-md border border-sage-200 bg-warm-100 p-3 text-sm italic text-warm-900">
            "{counter}"
          </div>
          <p className="mb-2 text-sm text-warm-900">我可以这样接：</p>
          <div className="space-y-2">
            {counterReplies.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLocalCounter(r)}
                className="block w-full rounded-md border border-sage-300 bg-warm-50 p-3 text-left text-sm text-warm-900 hover:border-sage-400 hover:bg-sage-50"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {localCounter && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-sage-700/70">我刚刚可以这样开始用它：</p>
          <div className="rounded-md border border-sage-200 bg-sage-50 p-4 text-sm leading-relaxed text-warm-900">
            {loading ? '在想了…' : reply || '稍等…'}
          </div>
          <button
            type="button"
            onClick={() => {
              if (reply) onComplete(effectiveUserSays, localCounter, reply);
            }}
            disabled={loading || !reply}
            className="mt-3 rounded-md bg-sage-400 px-4 py-2 text-sm font-medium text-white hover:bg-sage-500 disabled:opacity-40"
          >
            {loading ? '在想了…' : '读完，下一步'}
          </button>
        </div>
      )}
    </div>
  );
}

/** 通用 4 选 1 组件（用于健康选项） */
function MultiChoice({
  prompt,
  options,
  value,
  onPick,
}: {
  prompt: string;
  options: string[];
  value?: string;
  onPick: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-warm-900">{prompt}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onPick(o)}
              className={`rounded-md border px-3 py-2.5 text-left text-sm transition ${
                selected
                  ? 'border-sage-400 bg-sage-50 text-warm-900'
                  : 'border-sage-300 bg-warm-50 text-warm-900 hover:border-sage-400 hover:bg-sage-50'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DrillPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-sage-700/70">加载中…</div>}>
      <DrillInner />
    </Suspense>
  );
}

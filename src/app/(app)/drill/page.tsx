// src/app/(app)/drill/page.tsx
// v2.0.5 12 步固定流程演练 — Duolingo 风格：每步全选择题 + 其他兜底
'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Pause } from 'lucide-react';

import { CrisisBanner } from '@/components/crisis/CrisisBanner';
import { getScenarioOptions, scenarios } from '@/lib/scenarios-data';
import type { StepOptions } from '@/lib/scenarios-data';

type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const STEP_LABELS = {
  1: 'INTRO',
  2: '觉察',
  3: '命名',
  4: '需求',
  5: '边界',
  6: '开场',
  7: '演练',
  8: '应对',
  9: '收束',
  10: '演练后',
  11: '保存',
  12: 'OUTRO',
};

interface StepState {
  bodySignal?: string;
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
  const code = search.get('code') || 'workplace-shifting';

  const scenario = useMemo(
    () => scenarios.find((s) => s.code === code) || scenarios[0],
    [code],
  );
  const opts = useMemo<StepOptions>(() => getScenarioOptions(code), [code]);

  const [step, setStep] = useState<StepNo>(1);
  const [data, setData] = useState<StepState>({});
  const [crisis, setCrisis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);

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
            intent_override: 'drill', // v2.0.7.1: 显式跳过 Router
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
    if (step === 9) {
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
        <h2 className="text-lg font-medium">歇一下</h2>
        <p className="mt-2 text-sm text-neutral-500">草稿已保存。下次进来会回到这一步。</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            继续
          </button>
          <button
            type="button"
            onClick={() => router.push('/today')}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm"
          >
            改天继续
          </button>
          <button
            type="button"
            onClick={() => router.push('/today')}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm text-neutral-500"
          >
            直接退出（不计入进度）
          </button>
        </div>
      </div>
    );
  }

  if (step === 12) {
    const finalLine = data.reply || data.userSays || data.opener || opts.openers[0];
    return (
      <div className="mx-auto max-w-md py-12">
        <h1 className="text-2xl font-semibold">我刚刚练过了一次。</h1>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push('/progress')}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Check className="h-4 w-4" aria-hidden />
            点头
          </button>
        </div>
        <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm">
          <div className="text-xs text-neutral-500">我刚刚可以这样开始用它：</div>
          <p className="mt-2 leading-relaxed">{finalLine}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/scripts')}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          >
            加进我的剧本
          </button>
          <button
            type="button"
            onClick={() => router.push('/today')}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          >
            回到成长路
          </button>
        </div>
        <p className="mt-6 text-xs text-neutral-500">下次想练就练。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/today" className="text-xs text-neutral-500 hover:text-foreground">
          <ArrowLeft className="inline h-3 w-3" /> 回到成长路
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-label={'当前：' + STEP_LABELS[step]}>
            {Array.from({ length: 12 }).map((_, i) => {
              const cls = i + 1 <= step ? 'h-1.5 w-1.5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-border';
              return <span key={i} aria-hidden className={cls} />;
            })}
          </div>
          <span className="text-xs text-neutral-500">当前：{STEP_LABELS[step]}</span>
        </div>
        <button
          type="button"
          onClick={() => setPaused(true)}
          className="text-xs text-neutral-500 hover:text-foreground"
          aria-label="暂停演练"
        >
          <Pause className="inline h-3 w-3" /> 暂停
        </button>
      </div>

      <h1 className="text-lg font-semibold">{scenario.title}</h1>
      <p className="mt-1 text-xs text-neutral-500">{scenario.layer} · 估计 3 分钟</p>

      <div className="mt-6">
        {step === 1 && (
          <Step1 scenario={scenario} onStart={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2
            value={data.bodySignal}
            onPick={(v) => {
              setData((d) => ({ ...d, bodySignal: v }));
              setStep(3);
            }}
          />
        )}
        {step === 3 && (
          <MultiChoice
            prompt="用一个词命名这个情绪："
            options={opts.emotions}
            value={data.emotion}
            onPick={(v) => {
              setData((d) => ({ ...d, emotion: v }));
              setStep(4);
            }}
          />
        )}
        {step === 4 && (
          <MultiChoice
            prompt="我想要："
            options={opts.wants}
            value={data.iWant}
            onPick={(v) => {
              setData((d) => ({ ...d, iWant: v }));
              setStep(5);
            }}
          />
        )}
        {step === 5 && (
          <Step5
            wills={opts.wills}
            wonts={opts.wonts}
            will={data.iWill}
            wont={data.iWont}
            onChange={(field, value) => {
              setData((d) => ({ ...d, [field]: value }));
            }}
            onNext={() => setStep(6)}
          />
        )}
        {step === 6 && (
          <MultiChoice
            prompt="我可以这样开始："
            options={opts.openers}
            value={data.opener}
            onPick={(v) => {
              setData((d) => ({ ...d, opener: v }));
              setStep(7);
            }}
          />
        )}
        {step === 7 && (
          <Step7
            variants={opts.user_says_variants}
            opener={data.opener || ''}
            onNext={(text) => {
              setData((d) => ({ ...d, userSays: text }));
              setStep(8);
            }}
          />
        )}
        {step === 8 && (
          <Step8
            counter={opts.counter}
            replies={opts.counter_replies}
            onPick={(counter, reply) => {
              setData((d) => ({ ...d, counter, reply }));
              setStep(9);
            }}
          />
        )}
        {step === 9 && (
          <Step9
            loading={loading}
            reply={data.reply}
            onNext={() => setStep(10)}
          />
        )}
        {step === 10 && (
          <Step10
            scenarioTitle={scenario.title}
            onNext={() => setStep(11)}
          />
        )}
        {step === 11 && (
          <Step11
            reply={data.reply || data.userSays || data.opener || opts.openers[0] || ''}
            title={scenario.title}
            sceneTag={scenario.scene_tags[0] || 'workplace'}
            onNext={() => setStep(12)}
          />
        )}
      </div>
    </div>
  );
}

function Step1({ scenario, onStart }: { scenario: { title: string; one_liner: string }; onStart: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="text-xs text-neutral-500">场景</div>
        <p className="mt-2 text-sm leading-relaxed">{scenario.one_liner}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        开始
      </button>
    </div>
  );
}

function Step2({ value, onPick }: { value?: string; onPick: (v: string) => void }) {
  const options = ['紧张', '胸闷', '胃紧', '手心出汗', '没明显', '其他'];
  return (
    <div>
      <p className="mb-3 text-sm">此刻身体哪里有感觉？</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onPick(o)}
              className={
                'rounded-md border px-3 py-2 text-left text-sm transition ' +
                (selected
                  ? 'border-primary bg-primary-soft text-foreground'
                  : 'border-border bg-surface hover:border-primary/40')
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [showOther, setShowOther] = useState(false);
  const [other, setOther] = useState('');
  const isPreset = !!value && options.includes(value);
  const displayValue = value || undefined;

  return (
    <div>
      <p className="mb-3 text-sm">{prompt}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = displayValue === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onPick(o)}
              className={
                'rounded-md border px-3 py-2.5 text-left text-sm transition ' +
                (selected
                  ? 'border-primary bg-primary-soft text-foreground'
                  : 'border-border bg-surface hover:border-primary/40')
              }
            >
              {o}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowOther((s) => !s)}
          className={
            'rounded-md border px-3 py-2.5 text-left text-sm transition ' +
            (displayValue && !isPreset
              ? 'border-primary bg-primary-soft text-foreground'
              : 'border-border bg-surface hover:border-primary/40')
          }
        >
          其他…
        </button>
      </div>
      {showOther && (
        <div className="mt-3 flex gap-2">
          <input
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="写你的版本"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              const t = other.trim();
              if (t) onPick(t);
            }}
            disabled={!other.trim()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            用这个
          </button>
        </div>
      )}
    </div>
  );
}

function Step5({
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
  onChange: (field: 'iWill' | 'iWont', value: string) => void;
  onNext: () => void;
}) {
  // v2.0.6 fix: 选项不再触发 onNext（之前会让用户只答一题就跳到 step 6）
  return (
    <div className="space-y-5">
      <MultiChoice
        prompt="我愿意："
        options={wills}
        value={will}
        onPick={(v) => onChange('iWill', v)}
      />
      <MultiChoice
        prompt="我不愿意："
        options={wonts}
        value={wont}
        onPick={(v) => onChange('iWont', v)}
      />
      {will && wont && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          下一步
        </button>
      )}
    </div>
  );
}

function Step7({
  variants,
  opener,
  onNext,
}: {
  variants: string[];
  opener: string;
  onNext: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(opener);

  const ordered = variants.includes(opener)
    ? [opener].concat(variants.filter((v) => v !== opener))
    : [opener].concat(variants);

  if (editing) {
    return (
      <div>
        <p className="mb-2 text-sm text-neutral-500">改成你自己的版本：</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              const t = draft.trim();
              if (t) onNext(t);
            }}
            disabled={!draft.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            用这句
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm"
          >
            返回选项
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-neutral-500">我刚说出口的是：</p>
      <div className="space-y-2">
        {ordered.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onNext(v)}
            className="block w-full rounded-md border border-border bg-surface p-3 text-left text-sm hover:border-primary/40"
          >
            {v}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full rounded-md border border-dashed border-border bg-background p-3 text-left text-sm text-neutral-500 hover:border-primary/40 hover:text-foreground"
        >
          我要换一句…
        </button>
      </div>
    </div>
  );
}

function Step8({
  counter,
  replies,
  onPick,
}: {
  counter: string;
  replies: string[];
  onPick: (c: string, r: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-neutral-500">对方回应：</p>
      <div className="mb-3 rounded-md bg-surface p-3 text-sm italic">"{counter}"</div>
      <p className="mb-2 text-sm">我可以这样接：</p>
      <div className="space-y-2">
        {replies.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(counter, r)}
            className="block w-full rounded-md border border-border bg-surface p-3 text-left text-sm hover:border-primary/40"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step9({ loading, reply, onNext }: { loading: boolean; reply?: string; onNext: () => void }) {
  return (
    <div>
      <p className="mb-2 text-sm text-neutral-500">我刚刚可以这样开始用它：</p>
      <div className="rounded-md border border-border bg-primary-soft p-4 text-sm leading-relaxed">
        {loading ? '在想了…' : reply || '稍等…'}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={loading || !reply}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
      >
        读完，下一步
      </button>
    </div>
  );
}

function Step10({ scenarioTitle, onNext }: { scenarioTitle: string; onNext: () => void }) {
  return (
    <div>
      <p className="mb-3 text-sm">我刚刚练过了一次「{scenarioTitle}」。</p>
      <p className="mb-3 text-xs text-neutral-500">（默读一遍上面那句）</p>
      <button
        type="button"
        onClick={onNext}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        读完了
      </button>
    </div>
  );
}

function Step11({
  reply,
  title,
  sceneTag,
  onNext,
}: {
  reply: string;
  title: string;
  sceneTag: string;
  onNext: (save: boolean) => void;
}) {
  // v2.0.6 fix: 保存状态 + 失败可见反馈（之前 catch 静默）
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [savedId, setSavedId] = useState<string | null>(null);

  const save = async (saveIt: boolean) => {
    if (saveIt) {
      setSaving('saving');
      try {
        const res = await fetch('/api/scripts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, scene_tag: sceneTag, content: reply }),
        });
        if (!res.ok) throw new Error('save failed');
        const json = await res.json();
        setSavedId(json?.data?.id ?? null);
        setSaving('saved');
      } catch {
        setSaving('failed');
        return; // 失败不前进，让用户重试或选"改天 / 跳过"
      }
    }
    onNext(saveIt);
  };

  return (
    <div>
      <p className="mb-3 text-sm">把这句话加进我的剧本？</p>
      <div className="mb-3 rounded-md bg-surface p-3 text-sm leading-relaxed">{reply}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save(true)}
          disabled={saving === 'saving'}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {saving === 'saving' ? '存着…' : '加进剧本'}
        </button>
        <button
          type="button"
          onClick={() => void save(false)}
          disabled={saving === 'saving'}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          改天
        </button>
        <button
          type="button"
          onClick={() => void save(false)}
          disabled={saving === 'saving'}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          跳过
        </button>
      </div>
      {/* v2.0.6 fix: 失败/成功反馈（不再静默） */}
      <div className="mt-3 min-h-[1.25rem] text-xs" aria-live="polite">
        {saving === 'saved' && (
          <span className="text-primary">已存进我的剧本{savedId ? `（id ${savedId.slice(0, 8)}）` : ''}。</span>
        )}
        {saving === 'failed' && (
          <span className="text-warning">
            没存上（网络/服务异常）。稍后再试也行，或跳过。
          </span>
        )}
      </div>
    </div>
  );
}

export default function DrillPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">加载中…</div>}>
      <DrillInner />
    </Suspense>
  );
}
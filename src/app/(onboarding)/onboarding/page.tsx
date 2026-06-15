// src/app/(onboarding)/onboarding/page.tsx
// 来自 docs/02-Prototype.md §5.1
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    key: 'situation',
    title: '你最近最常感到委屈的是？',
    options: ['职场', '家庭', '朋友', '伴侣', '都差不多'],
  },
  {
    key: 'tone',
    title: '你更想听哪种语气？',
    options: ['平静 + 温暖', '平静 + 极简', '温和但坚定'],
  },
  {
    key: 'scenario',
    title: '想先从哪种场景练起？',
    options: ['拒绝同事', '回应父母', '跟伴侣开口', '跟朋友说不'],
  },
  {
    key: 'motion',
    title: '页面动效需要减少吗？',
    options: ['跟随系统', '都关掉'],
  },
  {
    key: 'alias',
    title: '想给自己起个化名吗？（可空）',
    options: [],
    free: true,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push('/today');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          帮善良的人学会有锋芒
        </h1>
        <div className="mt-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </header>

      <section className="flex-1">
        <h2 className="mb-8 text-xl font-medium leading-relaxed text-foreground">
          {current.title}
        </h2>

        {current.free ? (
          <input
            type="text"
            placeholder="可空，直接跳过也行"
            className="w-full rounded-lg border border-input bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            value={answers[current.key] || ''}
            onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
          />
        ) : (
          <div className="space-y-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [current.key]: opt })}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  answers[current.key] === opt
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface hover:bg-muted'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 space-y-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/today')}>
            先跳过
          </Button>
          <Button className="flex-1" onClick={next}>
            {step === STEPS.length - 1 ? '开始' : '下一步'}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          不委屈是成长陪伴，不替代专业心理咨询与诊疗。
        </p>
      </footer>
    </main>
  );
}

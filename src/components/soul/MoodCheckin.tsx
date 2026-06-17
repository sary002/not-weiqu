// src/components/soul/MoodCheckin.tsx
// v2.0.7.6 (ADR-005 灵魂设计) 情境卡组件 · 接真实 LLM
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0
'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  MOODS,
  saveMoodChoice,
  markMoodCheckinShown,
  loadPersonaPref,
  type MoodId,
} from '@/lib/persona';

interface Props {
  onComplete: (mood: MoodId, aiResponse: string) => void;
  onSkip: () => void;
}

type Phase = 'select' | 'loading' | 'response' | 'error';

export function MoodCheckin({ onComplete, onSkip }: Props) {
  const [selected, setSelected] = useState<MoodId | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [response, setResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelect = async (mood: MoodId) => {
    setSelected(mood);
    saveMoodChoice(mood);
    markMoodCheckinShown();
    setPhase('loading');

    try {
      const persona = loadPersonaPref();
      const res = await fetch('/api/soul/mood-respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mood, persona }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(data.response);
      setPhase('response');
    } catch (e) {
      console.error('[MoodCheckin] LLM call failed:', e);
      // 用 hardcode fallback（来自 MOODS.aiResponse）
      const found = MOODS.find((m) => m.id === mood);
      setResponse(found?.aiResponse ?? '今天想做什么都可以。');
      setErrorMsg('（AI 暂时没回应，我用本地的话替你）');
      setPhase('error');
    }
  };

  const handleContinue = () => {
    if (selected && response) {
      onComplete(selected, response);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-sage-200 bg-warm-50 p-6 shadow-lg">
        {phase === 'select' && (
          <>
            {/* 标题 */}
            <h2 className="text-center font-serif text-xl font-semibold text-warm-900">
              今天感觉怎么样？
            </h2>
            <p className="mt-1 text-center text-xs text-sage-600/70">
              不用给答案，我只是想知道
            </p>

            {/* 4 个情绪选项 */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleSelect(mood.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-all hover:scale-105 ${
                    selected === mood.id
                      ? 'border-sage-400 bg-sage-50 shadow-soft'
                      : 'border-sage-200 bg-warm-50 hover:border-sage-400 hover:bg-sage-50'
                  }`}
                >
                  <span className="text-3xl" aria-hidden>{mood.emoji}</span>
                  <span className="text-sm font-medium text-warm-900">{mood.label}</span>
                </button>
              ))}
            </div>

            {/* 跳过 */}
            <div className="mt-6 text-center">
              <button
                onClick={onSkip}
                className="text-xs text-sage-600/60 hover:text-sage-700"
              >
                下次再说
              </button>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-sage-400" />
            <p className="text-sm text-sage-700/70">在想怎么回应你...</p>
          </div>
        )}

        {(phase === 'response' || phase === 'error') && response && (
          <>
            <div className="py-8 text-center">
              <p className="font-serif text-lg leading-relaxed text-warm-900">
                {response}
              </p>
              {errorMsg && (
                <p className="mt-3 text-[10px] text-sage-600/60">{errorMsg}</p>
              )}
            </div>
            <button
              onClick={handleContinue}
              className="w-full rounded-md bg-sage-400 px-4 py-3 text-sm font-medium text-white transition hover:bg-sage-500"
            >
              好的
            </button>
          </>
        )}
      </div>
    </div>
  );
}

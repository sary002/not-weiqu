// src/components/soul/MoodCheckin.tsx
// v2.0.7.5 (ADR-005 灵魂设计 v2) 情境卡组件
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0
// 设计：进入今日页时弹 4 情绪选项，选完 AI 给温暖回应
'use client';
import { useState } from 'react';
import { MOODS, type MoodId, saveMoodChoice, markMoodCheckinShown } from '@/lib/persona';

interface Props {
  onComplete: (mood: MoodId, aiResponse: string) => void;
  onSkip: () => void;
}

export function MoodCheckin({ onComplete, onSkip }: Props) {
  const [selected, setSelected] = useState<MoodId | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  const handleSelect = (mood: MoodId) => {
    setSelected(mood);
    const found = MOODS.find((m) => m.id === mood);
    if (found) {
      saveMoodChoice(mood);
      markMoodCheckinShown();
      setResponse(found.aiResponse);
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
        {!response ? (
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
        ) : (
          <>
            {/* AI 回应 */}
            <div className="py-8 text-center">
              <p className="font-serif text-lg leading-relaxed text-warm-900">
                {response}
              </p>
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

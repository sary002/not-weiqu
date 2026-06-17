// src/components/soul/PersonaSelector.tsx
// v2.0.7.5 (ADR-005 灵魂设计 v2) 人格选择器组件
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0
'use client';
import { PERSONAS, type PersonaId } from '@/lib/persona';
import { Check } from 'lucide-react';

interface Props {
  current: PersonaId;
  onChange: (id: PersonaId) => void;
}

// 选中态样式 map（避免 Tailwind dynamic class）
const SELECTED_STYLES: Record<PersonaId, { border: string; bg: string; ring: string }> = {
  wen:  { border: 'border-cactus-flower', bg: 'bg-persona-wen',  ring: 'ring-2 ring-cactus-flower/30' },
  zhi:  { border: 'border-sky-400',        bg: 'bg-persona-zhi',  ring: 'ring-2 ring-sky-400/30' },
  song: { border: 'border-sunset',        bg: 'bg-persona-song', ring: 'ring-2 ring-sunset/30' },
};

export function PersonaSelector({ current, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.values(PERSONAS).map((p) => {
        const isSelected = current === p.id;
        const sel = SELECTED_STYLES[p.id];
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            aria-pressed={isSelected}
            className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all hover:scale-[1.02] ${
              isSelected
                ? `${sel.border} ${sel.bg} shadow-soft ${sel.ring}`
                : 'border-sage-200 bg-warm-50 hover:border-sage-400'
            }`}
          >
            {/* emoji */}
            <span className="text-3xl" aria-hidden>{p.emoji}</span>
            {/* 名字 */}
            <span className="text-base font-medium text-warm-900">{p.name}</span>
            {/* 一句话特征 */}
            <span className="text-center text-[10px] leading-tight text-sage-700/70">
              {p.oneLiner}
            </span>
            {/* 选中勾 */}
            {isSelected && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-warm-900 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// src/components/skilltree/SkillNode.tsx
// v2.0.7 (ADR-003 UI 视觉语言 v2) 技能节点 6 态组件
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §1 配色 + §4 微动效
// 节点 6 态：locked / available / in_progress / mastered_basic / mastered_deep / recommended
import Link from 'next/link';
import { Sparkles, Circle, Star, Play } from 'lucide-react';
import type { ReactNode } from 'react';

export type SkillStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'mastered_basic'
  | 'mastered_deep'
  | 'recommended';

interface Props {
  title: string;
  code: string | null;
  practiced: number;
  status: SkillStatus;
  draftStep?: string;
}

export function SkillNode({ title, code, practiced, status, draftStep }: Props) {
  const isLocked = status === 'locked';
  const isRecommended = status === 'recommended';
  const isMastered = status === 'mastered_basic' || status === 'mastered_deep';
  const isInProgress = status === 'in_progress';

  // ADR-003 §1 配色：recommended = cactus-flower + 呼吸光晕 / in_progress = sunset / mastered = sage-500
  const baseClass = `flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
    isLocked
      ? 'border-sage-200 bg-warm-100/40 opacity-50'
      : isRecommended
      ? 'border-cactus-flower bg-cactus-flower/5 shadow-soft ring-1 ring-cactus-flower/30 animate-breathe'
      : isInProgress
      ? 'border-sunset bg-sunset/5'
      : isMastered
      ? 'border-sage-300 bg-sage-50/60'
      : 'border-sage-200 bg-warm-50 hover:border-sage-400 hover:bg-sage-50'
  }`;

  const Icon = (): ReactNode => {
    if (isLocked) return <span className="text-xs text-sage-600/60">需 §1 走完</span>;
    if (isRecommended) return <Sparkles className="h-4 w-4 text-cactus-flower" aria-hidden />;
    if (isInProgress) return <Circle className="h-4 w-4 fill-sunset text-sunset" aria-hidden />;
    if (status === 'mastered_deep') return <Star className="h-4 w-4 fill-sage-500 text-sage-500" aria-hidden />;
    if (status === 'mastered_basic') return <Star className="h-4 w-4 text-sage-500" aria-hidden />;
    return <Play className="h-4 w-4 text-sage-600/60" aria-hidden />;
  };

  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon />
        <span className={isLocked ? 'text-sage-600/60' : 'text-warm-900'}>{title}</span>
      </div>
      <div className="text-xs text-sage-700/70">
        {isInProgress && draftStep && <span>练到 {draftStep}</span>}
        {isMastered && <span>练过 {practiced} 次</span>}
        {status === 'mastered_deep' && practiced >= 5 && <span className="ml-1 text-sage-600">· 深入</span>}
        {status === 'available' && code && <span>可练</span>}
        {isRecommended && <span className="font-medium text-cactus-flower">推荐</span>}
      </div>
    </>
  );

  if (isLocked || !code) {
    return <div className={baseClass} aria-disabled>{content}</div>;
  }

  return (
    <Link href={`/drill?code=${code}`} className={baseClass}>
      {content}
    </Link>
  );
}


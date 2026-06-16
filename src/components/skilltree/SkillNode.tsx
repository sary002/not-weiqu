// src/components/skilltree/SkillNode.tsx
// v2.0 技能节点 6 态组件：locked / available / in_progress / mastered_basic / mastered_deep / recommended
// 来自 docs/02-Prototype.md §4.4 + design-review-jobs.md §7.4 / §7.7
import Link from 'next/link';
import { Lock, Sparkles, Circle, Star, Play } from 'lucide-react';
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

  // v2.0.1 polish: 锁定节点不显示锁，改用半透明 + hover 引导
  const baseClass = `flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
    isLocked
      ? 'border-border bg-surface/40 opacity-50'
      : isRecommended
      ? 'border-primary bg-primary-soft shadow-soft ring-1 ring-primary/20'
      : isInProgress
      ? 'border-primary/40 bg-surface'
      : isMastered
      ? 'border-border bg-surface'
      : 'border-border bg-surface hover:border-primary/40'
  }`;

  const Icon = (): ReactNode => {
    if (isLocked) return <span className="text-xs text-neutral-400">需 §1 走完</span>;
    if (isRecommended) return <Sparkles className="h-4 w-4 text-primary" aria-hidden />;
    if (isInProgress) return <Circle className="h-4 w-4 text-primary" aria-hidden />;
    if (status === 'mastered_deep') return <Star className="h-4 w-4 fill-primary text-primary" aria-hidden />;
    if (status === 'mastered_basic') return <Star className="h-4 w-4 text-primary" aria-hidden />;
    return <Play className="h-4 w-4 text-neutral-400" aria-hidden />;
  };

  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon />
        <span className={isLocked ? 'text-neutral-500' : 'text-foreground'}>{title}</span>
      </div>
      <div className="text-xs text-neutral-500">
        {isInProgress && draftStep && <span>练到 {draftStep}</span>}
        {isMastered && <span>练过 {practiced} 次</span>}
        {status === 'mastered_deep' && practiced >= 5 && <span className="ml-1">· 深入</span>}
        {status === 'available' && code && <span>可练</span>}
        {isRecommended && <span className="font-medium text-primary">推荐</span>}
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

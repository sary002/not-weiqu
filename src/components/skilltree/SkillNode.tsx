// src/components/skilltree/SkillNode.tsx
// v2.0.7.4 (ADR-003 + 多邻国化 + 语义化图标) 技能节点 · 圆形按钮 + 图标
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §1 配色 + §6 图标
// 设计：圆内显示语义化图标，mastered 角标显示次数，in_progress 显示步骤
// 节点 6 态：locked / available / in_progress / mastered_basic / mastered_deep / recommended
import Link from 'next/link';
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
  /** 语义化图标（贴近描述） */
  icon: ReactNode;
}

interface StatusStyle {
  circle: string;
  text: string;
  stateText: string;
}

const STATUS_STYLES: Record<SkillStatus, StatusStyle> = {
  // 锁定：灰白圆 + 灰边
  locked: {
    circle: 'bg-sage-50 border-sage-200 text-sage-500',
    text: 'text-sage-600/60',
    stateText: '需先走完上一段',
  },
  // 可练：白底圆 + sage 边框
  available: {
    circle: 'bg-warm-50 border-sage-300 text-sage-600 hover:bg-sage-50 hover:border-sage-400',
    text: 'text-sage-700',
    stateText: '可练',
  },
  // 进行中：sunset 暖橙实心
  in_progress: {
    circle: 'bg-sunset border-sunset text-white shadow-soft',
    text: 'text-warm-900',
    stateText: '练到一半',
  },
  // 已掌握（基础）：sage-400 实心 + 白文字
  mastered_basic: {
    circle: 'bg-sage-400 border-sage-500 text-white shadow-soft',
    text: 'text-sage-700',
    stateText: '已掌握',
  },
  // 已掌握（深入）：sage-500 实心 + 深阴影
  mastered_deep: {
    circle: 'bg-sage-500 border-sage-600 text-white shadow-md',
    text: 'text-sage-800',
    stateText: '已深入',
  },
  // 推荐：cactus-flower 实心 + 呼吸光晕
  recommended: {
    circle: 'bg-cactus-flower border-cactus-flower text-white shadow-md animate-breathe',
    text: 'text-cactus-flower',
    stateText: '推荐你练',
  },
};

export function SkillNode({ title, code, practiced, status, draftStep, icon }: Props) {
  const isLocked = status === 'locked';
  const style = STATUS_STYLES[status];

  const inner = (
    <div className="flex flex-col items-center gap-2">
      {/* 圆形按钮主体：图标 + 角标 */}
      <div className="relative">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] transition-all ${style.circle}`}
          aria-hidden
        >
          {/* 语义化图标 */}
          <span className="flex items-center justify-center [&>svg]:h-9 [&>svg]:w-9">
            {icon}
          </span>
        </div>

        {/* mastered 角标：右下角显示已练次数 */}
        {(status === 'mastered_basic' || status === 'mastered_deep') && practiced > 0 && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-warm-50 bg-warm-50 text-[11px] font-bold text-sage-700 shadow-soft">
            {practiced > 99 ? '99+' : practiced}
          </span>
        )}

        {/* in_progress 角标：底部居中显示步骤 */}
        {status === 'in_progress' && draftStep && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-warm-50 bg-warm-50 px-2 py-0.5 text-[10px] font-bold text-sunset shadow-soft">
            {draftStep}
          </span>
        )}

        {/* locked 角标：右下角显示锁 */}
        {status === 'locked' && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-warm-50 bg-warm-50 text-[10px] text-sage-500 shadow-soft">
            🔒
          </span>
        )}
      </div>

      {/* 标题 */}
      <span className={`max-w-[6rem] text-center text-xs font-medium leading-tight ${style.text}`}>
        {title}
      </span>
      {/* 状态文字 */}
      <span className="text-[10px] text-sage-600/60">{style.stateText}</span>
    </div>
  );

  if (isLocked || !code) {
    return (
      <div className="cursor-not-allowed" aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/drill?code=${code}`} className="block transition-transform hover:scale-105">
      {inner}
    </Link>
  );
}

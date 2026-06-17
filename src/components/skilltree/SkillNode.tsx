// src/components/skilltree/SkillNode.tsx
// v2.0.7.2 (ADR-003 + 多邻国化) 技能节点 · 圆形按钮
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §1 配色
// 设计：多邻国风格圆形按钮，圆内显示数字/状态，标题在圆下方
// 节点 6 态：locked / available / in_progress / mastered_basic / mastered_deep / recommended
import Link from 'next/link';

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

interface StatusStyle {
  circle: string;
  text: string;
  centerLabel: string;
  stateText: string;
}

const STATUS_STYLES: Record<SkillStatus, StatusStyle> = {
  // 锁定：灰白圆 + 灰边
  locked: {
    circle: 'bg-sage-50 border-sage-200 text-sage-500',
    text: 'text-sage-600/60',
    centerLabel: '🔒',
    stateText: '需先走完上一段',
  },
  // 可练：白底圆 + sage 边框
  available: {
    circle: 'bg-warm-50 border-sage-300 text-sage-600 hover:bg-sage-50 hover:border-sage-400',
    text: 'text-sage-700',
    centerLabel: '○',
    stateText: '可练',
  },
  // 进行中：sunset 暖橙实心
  in_progress: {
    circle: 'bg-sunset border-sunset text-white shadow-soft',
    text: 'text-warm-900',
    centerLabel: '',
    stateText: '练到一半',
  },
  // 已掌握（基础）：sage-400 实心 + 白文字
  mastered_basic: {
    circle: 'bg-sage-400 border-sage-500 text-white shadow-soft',
    text: 'text-sage-700',
    centerLabel: '✓',
    stateText: '已掌握',
  },
  // 已掌握（深入）：sage-500 实心 + 深阴影
  mastered_deep: {
    circle: 'bg-sage-500 border-sage-600 text-white shadow-md',
    text: 'text-sage-800',
    centerLabel: '✓',
    stateText: '已深入',
  },
  // 推荐：cactus-flower 实心 + 呼吸光晕
  recommended: {
    circle: 'bg-cactus-flower border-cactus-flower text-white shadow-md animate-breathe',
    text: 'text-cactus-flower',
    centerLabel: '★',
    stateText: '推荐你练',
  },
};

/**
 * 计算圆内显示的数字
 */
function getCenterNumber(practiced: number, status: SkillStatus, draftStep?: string): string {
  if (status === 'mastered_basic' || status === 'mastered_deep') {
    return practiced > 99 ? '99+' : String(practiced);
  }
  if (status === 'in_progress' && draftStep) {
    return draftStep;
  }
  return '';
}

export function SkillNode({ title, code, practiced, status, draftStep }: Props) {
  const isLocked = status === 'locked';
  const style = STATUS_STYLES[status];
  const centerNumber = getCenterNumber(practiced, status, draftStep);

  const inner = (
    <div className="flex flex-col items-center gap-2">
      {/* 圆形按钮主体 */}
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] text-lg font-bold transition-all ${style.circle}`}
        aria-hidden
      >
        {centerNumber || style.centerLabel}
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

// src/components/skilltree/SkillNode.tsx
// v2.0.7.1 (ADR-003 UI 视觉语言 v2) 技能节点 · 多邻国风格按钮
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §1 配色 + §4 微动效
// 设计原则：不用前缀图标（不要单选框/五角星/闪光），整体颜色表达状态
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
  container: string;
  state: string;
  icon?: string;
}

const STATUS_STYLES: Record<SkillStatus, StatusStyle> = {
  // 锁定：灰白底 + 灰边 + 半透明，不能点
  locked: {
    container: 'bg-sage-50/60 border-sage-200 text-sage-600/60 opacity-50 cursor-not-allowed',
    state: '需先走完上一段',
  },
  // 可练：白底 + sage 边框 + sage 文字，hover 加底色
  available: {
    container: 'bg-warm-50 border-sage-300 text-sage-700 hover:bg-sage-50 hover:border-sage-400',
    state: '可练',
  },
  // 进行中：sunset 暖橙边 + 浅橙底
  in_progress: {
    container: 'bg-sunset/10 border-sunset text-warm-900 hover:bg-sunset/15',
    state: '练到一半',
  },
  // 已掌握（基础）：sage-400 实心 + 白文字
  mastered_basic: {
    container: 'bg-sage-400 border-sage-500 text-white shadow-soft hover:bg-sage-500',
    state: '已掌握',
  },
  // 已掌握（深入）：sage-500 实心 + 阴影更深
  mastered_deep: {
    container: 'bg-sage-500 border-sage-600 text-white shadow-md hover:bg-sage-600',
    state: '已深入',
  },
  // 推荐：cactus-flower 实心 + 白文字 + 呼吸光晕
  recommended: {
    container: 'bg-cactus-flower border-cactus-flower text-white shadow-md animate-breathe hover:bg-cactus-flower/90',
    state: '推荐你练',
  },
};

export function SkillNode({ title, code, practiced, status, draftStep }: Props) {
  const isLocked = status === 'locked';
  const style = STATUS_STYLES[status];

  // 动态 state 文案
  let stateText = style.state;
  if (status === 'in_progress' && draftStep) {
    stateText = `练到 ${draftStep}`;
  } else if (status === 'mastered_basic' || status === 'mastered_deep') {
    stateText = `练过 ${practiced} 次`;
  }

  const content = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-base font-medium">{title}</span>
      <span className="text-xs opacity-80">{stateText}</span>
    </div>
  );

  if (isLocked || !code) {
    return (
      <div
        className={`block rounded-xl border-2 px-4 py-3 transition-all ${style.container}`}
        aria-disabled
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/drill?code=${code}`}
      className={`block rounded-xl border-2 px-4 py-3 transition-all ${style.container}`}
    >
      {content}
    </Link>
  );
}

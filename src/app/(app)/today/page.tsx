// src/app/(app)/today/page.tsx
// v2.0.7.3 (ADR-003 + 完全多邻国化) 边界成长路 · 关卡地图
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md + 多邻国关卡地图参考
// 设计：5 段分组，节点左右偏移（之字形），S 形 SVG 曲线连接
import Link from 'next/link';
import { Fragment } from 'react';
import { SkillNode, type SkillStatus } from '@/components/skilltree/SkillNode';

interface SkillSeed {
  id: string;
  title: string;
  code: string | null;
  practiced: number;
  status: SkillStatus;
  draftStep?: string;
}

interface SectionSeed {
  id: string;
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  name: string;
  skills: SkillSeed[];
}

/**
 * S 形 SVG 连接器（在两个节点之间画 S 形曲线）
 * 方向根据 fromSide / toSide 决定（left / right）
 */
function ZigzagConnector({
  fromSide,
  toSide,
}: {
  fromSide: 'left' | 'right';
  toSide: 'left' | 'right';
}) {
  // SVG viewBox: 80 × 60
  // 起点 (x=10, y=0) → 终点 (x=70, y=60) 或反之
  // 用 cubic bezier 画 S 形
  const startX = fromSide === 'left' ? 10 : 70;
  const endX = toSide === 'left' ? 10 : 70;
  const path = `M ${startX} 0 C ${startX === 10 ? 70 : 10} 20, ${endX === 10 ? 70 : 10} 40, ${endX} 60`;

  return (
    <div className="flex h-10 w-24 items-center justify-center" aria-hidden>
      <svg
        viewBox="0 0 80 60"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          stroke="#C9D9B7"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

export default function TodayPage() {
  // 5 段技能树骨架
  const sections: SectionSeed[] = [
    {
      id: 's1',
      layer: 'L1',
      name: '觉察',
      skills: [
        { id: 's1-body', title: '听见身体的信号', code: 'l1-body-awareness', practiced: 2, status: 'mastered_deep' },
        { id: 's1-name', title: '给情绪命名', code: 'l1-emotion-naming', practiced: 1, status: 'mastered_basic' },
        { id: 's1-pattern', title: '看见讨好模式', code: 'l1-pattern-spotting', practiced: 0, status: 'in_progress', draftStep: '5/12' },
      ],
    },
    {
      id: 's2',
      layer: 'L2',
      name: '命名',
      skills: [
        { id: 's2-want', title: '说出"我想要"', code: 'family-marriage', practiced: 0, status: 'recommended' },
        { id: 's2-wont', title: '说出"我不想"', code: 'family-money', practiced: 0, status: 'available' },
        { id: 's2-mine', title: '区分我的/别人的', code: 'partner-cold', practiced: 0, status: 'available' },
      ],
    },
    {
      id: 's3', layer: 'L3', name: '表达',
      skills: [
        { id: 's3-a', title: '拒绝朋友借钱', code: 'friend-borrow', practiced: 0, status: 'locked' },
        { id: 's3-b', title: '应对家庭聚会', code: 'in-laws', practiced: 0, status: 'locked' },
      ],
    },
    {
      id: 's4', layer: 'L4', name: '兜底',
      skills: [
        { id: 's4-a', title: '被回绝后自我安抚', code: null, practiced: 0, status: 'locked' },
      ],
    },
    {
      id: 's5', layer: 'L5', name: '巩固',
      skills: [
        { id: 's5-a', title: '30 日回顾', code: null, practiced: 0, status: 'locked' },
      ],
    },
  ];

  const totalPracticed = sections.flatMap((s) => s.skills).reduce((sum, sk) => sum + sk.practiced, 0);
  const gentleStreak = { days: 3, restDaysLeftThisWeek: 1 };

  return (
    <div className="mx-auto max-w-md space-y-10 px-4 py-8">
      {/* 顶部状态条 */}
      <header className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-warm-900">今日</h1>
        <p className="mt-2 text-sm text-sage-700/70">
          🌱 练过 {totalPracticed} 次 · {gentleStreak.days} 天的练习 · 可休整 {gentleStreak.restDaysLeftThisWeek} 天
        </p>
      </header>

      {/* 流程化路径：5 段分组，每段内节点左右偏移（之字形）+ S 形曲线连接 */}
      <section>
        <h2 className="mb-8 text-center font-serif text-sm font-medium text-sage-700">
          边界成长路
        </h2>
        <ol className="space-y-10">
          {sections.map((s, idx) => (
            <li key={s.id}>
              {/* 段标题 */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="font-mono text-xs text-sage-600/60">§{idx + 1}</span>
                <span className="font-serif text-base font-medium text-warm-900">
                  {s.name}
                </span>
                <span className="text-xs text-sage-600/60">· {s.layer}</span>
              </div>
              {/* 段内节点：紧凑左右偏移 + S 形曲线连接（容器宽度自适应内容） */}
              <ul className="mx-auto flex flex-col items-stretch w-48">
                {s.skills.map((sk, i) => {
                  const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
                  const nextSide: 'left' | 'right' = (i + 1) % 2 === 0 ? 'left' : 'right';
                  return (
                    <Fragment key={sk.id}>
                      <li
                        className={side === 'left' ? 'self-start' : 'self-end'}
                      >
                        <SkillNode
                          title={sk.title}
                          code={sk.code}
                          practiced={sk.practiced}
                          status={sk.status}
                          draftStep={sk.draftStep}
                        />
                      </li>
                      {i < s.skills.length - 1 && (
                        <li aria-hidden className="-my-2 self-center">
                          <ZigzagConnector fromSide={side} toSide={nextSide} />
                        </li>
                      )}
                    </Fragment>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* 退出路径 */}
      <div className="border-t border-sage-200 pt-6 text-center">
        <Link
          href="/conversation"
          className="inline-block rounded-md border border-sage-300 bg-warm-50 px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
        >
          今天就到这里
        </Link>
        <p className="mt-4 text-xs text-sage-600/60">
          不委屈是成长陪伴，不替代专业心理咨询。
        </p>
      </div>
    </div>
  );
}

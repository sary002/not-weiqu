// src/app/(app)/today/page.tsx
// v2.0 技能树主页（边界成长路 5 段 × 节点 6 态）
// 来自 docs/02-Prototype.md §6.2 + design-review-jobs.md §7.1 / §7.4 / §7.6
import Link from 'next/link';
import { scenarios } from '@/lib/scenarios-data';
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

export default function TodayPage() {
  // 5 段技能树骨架（v2.0 形态：今日只点亮 §1 + §2，§3-5 半透明）
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
        { id: 's2-mine', title: '区分"我的 / 别人的"', code: 'partner-cold', practiced: 0, status: 'available' },
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
  const practicedToday = 0;
  // v2.0.1 polish：去"🔥"去"连续"加"可休整 1 天"
  const gentleStreak = { days: 3, restDaysLeftThisWeek: 1 };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">今日</h1>
        <p className="mt-2 text-sm text-neutral-500">
          🌱 练过 {totalPracticed} 次 · {gentleStreak.days} 天的练习 · 可休整 {gentleStreak.restDaysLeftThisWeek} 天
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-500">边界成长路</h2>
        <ol className="space-y-6">
          {sections.map((s, idx) => (
            <li key={s.id}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-xs font-mono text-neutral-500">§{idx + 1}</span>
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-neutral-500">· {s.layer}</span>
              </div>
              <ul className="space-y-2 pl-4">
                {s.skills.map((sk) => (
                  <li key={sk.id}>
                    <SkillNode
                      title={sk.title}
                      code={sk.code}
                      practiced={sk.practiced}
                      status={sk.status}
                      draftStep={sk.draftStep}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* v2.0.1 polish: "今天就到这里" 永远可达 */}
      <div className="border-t border-border pt-6 text-center">
        <Link
          href="/conversation"
          className="inline-block rounded-md border border-border bg-background px-4 py-2 text-sm text-neutral-500 hover:bg-muted"
        >
          今天就到这里
        </Link>
        <p className="mt-4 text-xs text-neutral-500">
          不委屈是成长陪伴，不替代专业心理咨询。
        </p>
      </div>
    </div>
  );
}

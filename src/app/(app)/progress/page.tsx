// src/app/(app)/progress/page.tsx
// v2.0 我 → 进度：5 段旅程地图 + 当前位置 + 累计瞬间 + 自报
// 来自 docs/02-Prototype.md §6.10 + design-review-jobs.md §7.5 / §7.9
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  practiced: number;
  total: number;
  state: '走完' | '在路上' | '你在这里' | '待开启';
  current?: boolean;
}

const SELF_REPORT_BUCKETS = [
  { id: 'said_no', label: '平静地说了一次"不"' },
  { id: 'no_apology', label: '没道歉就退出' },
  { id: 'set_boundary', label: '设立了边界' },
  { id: 'named_need', label: '说出了"我需要"' },
] as const;

type SelfReportId = (typeof SELF_REPORT_BUCKETS)[number]['id'];

export default function ProgressPage() {
  // v2.0 demo data: 5 段掌握度（v2.0 拒绝 KPI 化，使用"走完/在路上/你在这里/待开启"叙事短语）
  const initialSections: Section[] = [
    { id: 's1', name: '觉察', practiced: 8, total: 12, state: '走完' },
    { id: 's2', name: '命名', practiced: 4, total: 10, state: '在路上' },
    { id: 's3', name: '表达', practiced: 2, total: 15, state: '你在这里', current: true },
    { id: 's4', name: '兜底', practiced: 0, total: 9, state: '待开启' },
    { id: 's5', name: '巩固', practiced: 0, total: 6, state: '待开启' },
  ];

  const [sections, setSections] = useState<Section[]>(initialSections);
  // v2.0.6 fix: 自报状态独立管理
  const [selfReports, setSelfReports] = useState<Record<SelfReportId, number>>({
    said_no: 0,
    no_apology: 0,
    set_boundary: 0,
    named_need: 0,
  });
  const [submittingBucket, setSubmittingBucket] = useState<SelfReportId | null>(null);

  // v2.0.1 polish: 去"连续" / 加"可休整 1 天"
  const gentleStreak = { days: 3, restDaysLeftThisWeek: 1 };
  const totalPracticed = sections.reduce((s, sec) => s + sec.practiced, 0)
    + Object.values(selfReports).reduce((s, n) => s + n, 0);
  const coveredSkills = 5;
  const totalSkills = 17;

  // v2.0.6 fix: 自报改为 client-side POST + 乐观更新 + 反馈
  const submitSelfReport = async (bucket: SelfReportId) => {
    if (submittingBucket) return;
    setSubmittingBucket(bucket);
    // 乐观更新：立即 +1，失败回滚
    const prev = selfReports[bucket];
    setSelfReports((s) => ({ ...s, [bucket]: s[bucket] + 1 }));
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bucket, count: 1 }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      // 回滚 + 给提示
      setSelfReports((s) => ({ ...s, [bucket]: prev }));
      alert('没存上，稍后再试也行。');
    } finally {
      setSubmittingBucket(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">我</h1>
          <p className="mt-1 text-sm text-neutral-500">这些是变化的小事。</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="设置"
        >
          <Settings className="h-3.5 w-3.5" /> 设置
        </Link>
      </header>

      {/* 累计 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <ul className="space-y-2 text-sm">
          <li className="flex items-baseline justify-between">
            <span className="text-neutral-500">练过的瞬间</span>
            <span className="font-mono">{totalPracticed} 次</span>
          </li>
          <li className="flex items-baseline justify-between">
            <span className="text-neutral-500">覆盖的微技能</span>
            <span className="font-mono">
              {coveredSkills} / {totalSkills}
            </span>
          </li>
          <li className="flex items-baseline justify-between">
            <span className="text-neutral-500">温和连击</span>
            <span>
              {gentleStreak.days} 天的练习 · 可休整 {gentleStreak.restDaysLeftThisWeek} 天
            </span>
          </li>
        </ul>
      </section>

      {/* v2.0.1 polish: 5 段旅程地图（不画进度条，画"你在哪"） */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-500">
          边界成长路 · 我在「{sections.find((s) => s.current)?.name}」
        </h2>
        <ol className="space-y-0">
          {sections.map((s, i) => (
            <li key={s.id} className="flex items-stretch gap-3">
              <div className="flex w-24 flex-col items-end pt-1">
                <div className="text-xs text-neutral-500">§{i + 1} {s.name}</div>
                <div className="font-mono text-xs text-neutral-500">
                  {s.practiced}/{s.total}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    s.current ? 'bg-primary ring-2 ring-primary/30' : s.state === '走完' ? 'bg-primary' : 'bg-border'
                  }`}
                  aria-hidden
                />
                {i < sections.length - 1 && (
                  <div className="my-0.5 w-px flex-1 bg-border" aria-hidden style={{ minHeight: '24px' }} />
                )}
              </div>
              <div className="flex-1 pb-4 pt-0.5">
                <div
                  className={`text-sm ${
                    s.current ? 'font-medium text-foreground' : s.state === '走完' ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {s.state}
                </div>
                {s.current && (
                  <div className="mt-1 text-xs text-neutral-500">→ 下次想练就练 · 4 个微技能可探索</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* v2.0.6 fix: 自报改为 client-side POST + 反馈 + 计数显示 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-medium text-neutral-500">刚刚做到了吗？</h3>
        <p className="mb-3 text-xs text-neutral-500">不内卷。点一次就行。</p>
        <div className="grid grid-cols-2 gap-2">
          {SELF_REPORT_BUCKETS.map((b) => {
            const count = selfReports[b.id];
            const submitting = submittingBucket === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => void submitSelfReport(b.id)}
                disabled={submitting}
                aria-label={`${b.label}，目前 ${count} 次`}
                className="flex flex-col items-start gap-1 rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:border-primary/40 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span>{b.label}</span>
                {count > 0 && (
                  <span className="font-mono text-[10px] text-primary" aria-live="polite">
                    {count} 次
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

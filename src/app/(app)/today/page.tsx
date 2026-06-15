// src/app/(app)/today/page.tsx
// 来自 docs/02-Prototype.md §5.2
import Link from 'next/link';
import { scenarios } from '@/lib/scenarios-data';
import { ScenarioCard } from '@/components/drill/ScenarioCard';

export default function TodayPage() {
  const today = scenarios[0];
  const alternatives = scenarios.slice(1, 4);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">今日</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          一个轻量的场景，挑一个开始。
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
        <div className="mb-2 text-xs text-muted-foreground">今天的练习</div>
        <h2 className="text-xl font-medium leading-relaxed">{today.title}</h2>
        <p className="mt-3 text-sm text-neutral-500">{today.one_liner}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href={`/drill?code=${today.code}`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            选这条
          </Link>
          <Link
            href="/drill?code=custom"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            自定义场景
          </Link>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">也可以练</h3>
        <div className="grid gap-3">
          {alternatives.map((s) => (
            <ScenarioCard key={s.code} scenario={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

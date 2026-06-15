// src/app/(app)/progress/page.tsx
// 复盘：docs/02-Prototype.md §5.7
'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ProgressPage() {
  const [progress, setProgress] = useState<{ bucket: string; count: number }[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then((d) => setProgress(d.data?.buckets ?? []));
  }, []);

  const inc = async (bucket: string) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bucket }),
    });
    setProgress((p) => p.map((b) => (b.bucket === bucket ? { ...b, count: b.count + 1 } : b)));
  };

  if (hidden) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-sm text-muted-foreground">
        复盘页已关闭。随时可以回来。
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">复盘</h1>
          <p className="mt-1 text-sm text-muted-foreground">这些是你在变化的小事。</p>
        </div>
        <button
          onClick={() => setHidden(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> 关闭
        </button>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">这个月你做到了：</h2>
        <ul className="space-y-3">
          {progress.filter((p) => p.count > 0).length === 0 ? (
            <li className="text-sm text-neutral-500">还没有记录。点下面的按钮开始。</li>
          ) : (
            progress
              .filter((p) => p.count > 0)
              .map((p) => (
                <li key={p.bucket} className="flex items-center justify-between text-sm">
                  <span>{LABELS[p.bucket] || p.bucket}</span>
                  <span className="font-mono text-neutral-500">{p.count}</span>
                </li>
              ))
          )}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">今天又做到了吗？</h3>
        <div className="grid grid-cols-2 gap-2">
          {BUCKETS.map((b) => (
            <button
              key={b}
              onClick={() => inc(b)}
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm hover:bg-muted"
            >
              {LABELS[b]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const BUCKETS = ['said_no', 'no_apology', 'set_boundary', 'named_need'];
const LABELS: Record<string, string> = {
  said_no: '平静地说了一次"不"',
  no_apology: '没道歉就退出',
  set_boundary: '设立了边界',
  named_need: '说出了"我需要"',
};

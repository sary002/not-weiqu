// src/components/layout/GlobalHeader.tsx
// v2.0.6 顶部：Logo + 低压力模式开关（默认 ON）
// 来自 docs/02-Prototype.md §5.2 + design-review-jobs.md §6.1
// v2.0.6 修：键盘 focus-visible 焦点态
import Link from 'next/link';
import { Shield } from 'lucide-react';

export function GlobalHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/today"
          className="text-lg font-semibold text-primary rounded-md px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          不委屈
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            aria-label="低压力模式（默认开）"
            title="低压力模式（默认开）"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-primary-soft px-2.5 py-1 text-xs text-primary transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span>低压力 · 开</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

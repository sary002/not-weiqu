// src/components/layout/GlobalHeader.tsx
// 顶部导航：Logo + 入口
import Link from 'next/link';

export function GlobalHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/today" className="text-lg font-semibold text-primary">
          不委屈
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/today" className="hover:text-foreground">今日</Link>
          <Link href="/scripts" className="hover:text-foreground">剧本</Link>
          <Link href="/progress" className="hover:text-foreground">复盘</Link>
          <Link href="/settings" className="hover:text-foreground">设置</Link>
        </nav>
      </div>
    </header>
  );
}

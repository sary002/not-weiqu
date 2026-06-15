// src/components/layout/ExitPauseBar.tsx
// 任何页面可达：暂停 / 退出
'use client';
import { useRouter } from 'next/navigation';
import { Pause, X } from 'lucide-react';

export function ExitPauseBar() {
  const router = useRouter();
  return (
    <div className="border-b border-border bg-muted/50">
      <div className="container flex h-9 items-center justify-end gap-2 text-xs">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pause className="h-3 w-3" />
          暂停
        </button>
        <button
          onClick={() => router.push('/onboarding')}
          className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
          退出
        </button>
      </div>
    </div>
  );
}

// src/app/(app)/layout.tsx
// 主应用布局：顶部随时退出 + 底部「不替代专业」常驻
import Link from 'next/link';
import { ExitPauseBar } from '@/components/layout/ExitPauseBar';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { GlobalFooter } from '@/components/layout/GlobalFooter';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />
      <ExitPauseBar />
      <main className="container flex-1 py-6">{children}</main>
      <GlobalFooter />
    </div>
  );
}

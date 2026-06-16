// src/app/(app)/layout.tsx
// v2.0 主应用布局：顶部随时退出 + 4 Tab 底部导航 + 不替代专业常驻
import { ExitPauseBar } from '@/components/layout/ExitPauseBar';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />
      <ExitPauseBar />
      <main className="container flex-1 py-6 pb-24">{children}</main>
      <GlobalFooter />
      <BottomNav />
    </div>
  );
}

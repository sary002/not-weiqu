// src/components/layout/GlobalHeader.tsx
// v2.0.7 (ADR-003 UI 视觉语言 v2) 顶部：圆润仙人掌 Logo + Slogan + 低压力模式开关
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §2 Logo + §3 字体
import Link from 'next/link';
import Image from 'next/image';
import { Shield } from 'lucide-react';

export function GlobalHeader() {
  return (
    <header className="border-b border-sage-200 bg-warm-50/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* 左侧：Logo + 品牌名 + Slogan */}
        <Link
          href="/today"
          className="group flex items-center gap-2.5 rounded-md px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
          aria-label="返回今日"
        >
          <span className="logo-loader transition-transform group-hover:scale-105">
            <Image
              src="/logo-icon.svg"
              alt="不委屈"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-base font-semibold text-sage-700">
              不委屈
            </span>
            <span className="hidden text-[10px] text-sage-600/70 sm:inline">
              帮善良的人学会有锋芒
            </span>
          </span>
        </Link>

        {/* 右侧：低压力模式开关 */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            aria-label="低压力模式（默认开）"
            title="低压力模式（默认开）"
            className="inline-flex items-center gap-1 rounded-full border border-sage-300 bg-sage-50 px-2.5 py-1 text-xs text-sage-700 transition hover:bg-sage-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span>低压力 · 开</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

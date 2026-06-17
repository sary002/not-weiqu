// src/components/layout/BottomNav.tsx
// v2.0.7 (ADR-003 UI 视觉语言 v2) 4 Tab 底部导航：今日 / 自由对话 / 我的剧本 / 我
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §1 配色 + §6 图标
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, BookOpen, User } from 'lucide-react';

const TABS = [
  { href: '/today', label: '今日', Icon: Home },
  { href: '/conversation', label: '自由对话', Icon: MessageCircle },
  { href: '/scripts', label: '我的剧本', Icon: BookOpen },
  { href: '/progress', label: '我', Icon: User },
] as const;

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="底部主导航"
      className="sticky bottom-0 z-30 border-t border-sage-200 bg-warm-50/95 backdrop-blur"
    >
      <ul className="container flex h-16 items-stretch justify-around">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href || path?.startsWith(href + '/');
          return (
            <li key={href} className="flex flex-1 items-stretch">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
                  active
                    ? 'text-sage-700 font-medium'
                    : 'text-sage-600/60 hover:bg-sage-50 hover:text-sage-700 focus-visible:bg-sage-50 focus-visible:text-sage-700'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


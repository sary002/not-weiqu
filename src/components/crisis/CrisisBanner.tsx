// src/components/crisis/CrisisBanner.tsx
// v2.0.7 (ADR-003 UI 视觉语言 v2) 危机兜底页
// 来自 docs/decisions/adr-003-ui-visual-language-v2.md §3 字体 + §1 配色
// 关键原则：禁用所有动效（已在 globals.css .crisis-page 强制）+ 用暖色不用冷色 + 不用红色警告
'use client';
import Link from 'next/link';
import { Phone, Heart } from 'lucide-react';

const HOTLINES = [
  { name: '北京心理危机研究与干预中心', phone: '010-82951332' },
  { name: '全国心理援助热线', phone: '400-161-9995' },
];

export function CrisisBanner({
  onSafe,
  onKeepTalking,
}: {
  onSafe?: () => void;
  onKeepTalking?: () => void;
}) {
  return (
    <div className="crisis-page mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12 text-center">
      {/* 仙人掌果色（暖红），不用纯红警告色 */}
      <Heart className="mx-auto mb-6 h-12 w-12 text-cactus-flower" />
      <h1 className="mb-3 font-serif text-2xl font-semibold text-warm-900">
        你现在不太好。
      </h1>
      <p className="mb-12 text-base text-warm-700">我们想先陪着你。</p>

      <div className="space-y-4 rounded-2xl border border-sage-300 bg-warm-100 p-6 text-left">
        <div className="flex items-center gap-2 text-sm font-medium text-sage-700">
          <Phone className="h-4 w-4 text-sage-600" />
          24 小时心理援助热线
        </div>
        {HOTLINES.map((h) => (
          <a
            key={h.phone}
            href={`tel:${h.phone}`}
            className="block rounded-lg border border-sage-200 bg-warm-50 px-4 py-3 transition-colors hover:bg-sage-50"
          >
            <div className="text-sm font-medium text-warm-900">{h.name}</div>
            <div className="font-mono text-lg font-semibold text-cactus-flower">
              {h.phone}
            </div>
          </a>
        ))}
        <div className="mt-4 text-sm text-warm-700">
          也可以：联系你信任的人 / 就近医院精神科
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onSafe}
          className="flex-1 rounded-md border border-sage-300 bg-warm-50 px-4 py-3 text-sm font-medium text-sage-700 hover:bg-sage-50"
        >
          我现在安全
        </button>
        <Link
          href="/crisis"
          onClick={onKeepTalking}
          className="flex-1 rounded-md bg-sage-400 px-4 py-3 text-center text-sm font-medium text-white hover:bg-sage-500"
        >
          我想继续聊
        </Link>
      </div>
    </div>
  );
}


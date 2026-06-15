// src/components/crisis/CrisisBanner.tsx
// 来自 docs/02-Prototype.md §5.5 + rules/safety.md §S-2
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
      <Heart className="mx-auto mb-6 h-12 w-12 text-primary" />
      <h1 className="mb-3 text-2xl font-semibold text-foreground">
        你现在不太好。
      </h1>
      <p className="mb-12 text-base text-neutral-500">我们想先陪着你。</p>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6 text-left">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-primary" />
          24 小时心理援助热线
        </div>
        {HOTLINES.map((h) => (
          <a
            key={h.phone}
            href={`tel:${h.phone}`}
            className="block rounded-lg bg-muted px-4 py-3 transition-colors hover:bg-primary-soft"
          >
            <div className="text-sm font-medium">{h.name}</div>
            <div className="text-lg font-mono font-semibold text-primary">{h.phone}</div>
          </a>
        ))}
        <div className="mt-4 text-sm text-neutral-500">
          也可以：联系你信任的人 / 就近医院精神科
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onSafe}
          className="flex-1 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-muted"
        >
          我现在安全
        </button>
        <Link
          href="/crisis"
          onClick={onKeepTalking}
          className="flex-1 rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
        >
          我想继续聊
        </Link>
      </div>
    </div>
  );
}

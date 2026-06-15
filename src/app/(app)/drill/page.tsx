// src/app/(app)/drill/page.tsx
// 演练：docs/02-Prototype.md §5.3
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { scenarios } from '@/lib/scenarios-data';
import { ChatBubble } from '@/components/conversation/ChatBubble';
import { Composer } from '@/components/conversation/Composer';
import { CrisisBanner } from '@/components/crisis/CrisisBanner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  meta?: { try_this?: string; next_step?: string; acknowledge?: string; name_it?: string; need?: string };
}

function DrillInner() {
  const search = useSearchParams();
  const code = search.get('code') || 'workplace-overtime';
  const scenario = scenarios.find((s) => s.code === code) || scenarios[0];
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `AI（同事）："我马上要走了，你帮我做一下呗？"` },
  ]);
  const [crisis, setCrisis] = useState(false);
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'drill' }),
      });
      const conv = await res.json();
      const r = await fetch(`/api/conversations/${conv.data.id}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await r.json();
      if (data.data?.crisis) {
        setCrisis(true);
      } else {
        const reply = data.data?.reply;
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: [reply.acknowledge, reply.name_it, reply.need, reply.try_this, reply.next_step]
              .filter(Boolean)
              .join('\n\n'),
            meta: reply,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (crisis) return <CrisisBanner onSafe={() => setCrisis(false)} />;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">演练：{scenario.title}</h1>
        </div>
        <span className="text-xs text-muted-foreground">{scenario.layer}</span>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} meta={m.meta} />
        ))}
        {loading && <div className="text-xs text-muted-foreground">在想了…</div>}
      </div>
      <Composer onSend={send} disabled={loading} />
    </div>
  );
}

export default function DrillPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">加载中…</div>}>
      <DrillInner />
    </Suspense>
  );
}

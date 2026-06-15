// src/app/(app)/conversation/page.tsx
// 自由对话：docs/02-Prototype.md §5.4
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Composer } from '@/components/conversation/Composer';
import { ChatBubble } from '@/components/conversation/ChatBubble';
import { CrisisBanner } from '@/components/crisis/CrisisBanner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  meta?: {
    try_this?: string;
    next_step?: string;
    acknowledge?: string;
    name_it?: string;
    need?: string;
  };
  crisis?: boolean;
}

export default function ConversationPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState<{ type: string } | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'free' }),
    })
      .then((r) => r.json())
      .then((d) => setConversationId(d.data?.id ?? null))
      .catch(() => setConversationId(null));
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || !conversationId) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: text, client_msg_id: crypto.randomUUID() }),
      });
      const data = await res.json();
      if (data.data?.crisis) {
        setCrisis({ type: 'crisis' });
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: '', crisis: true },
        ]);
      } else if (data.data?.reply) {
        const r = data.data.reply;
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: [r.acknowledge, r.name_it, r.need, r.try_this, r.next_step]
              .filter(Boolean)
              .join('\n\n'),
            meta: r,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '我们这会有点忙，再说一次？' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (crisis) {
    return <CrisisBanner onSafe={() => { setCrisis(null); setMessages([]); }} onKeepTalking={() => router.push('/crisis')} />;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">跟不委屈说</h1>
        <span className="text-xs text-muted-foreground">我在这，随时退出</span>
      </header>

      <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="rounded-lg bg-primary-soft p-4 text-sm text-neutral-500">
            <p>我在这。</p>
            <p className="mt-2">想聊什么都行；不聊也行。</p>
          </div>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} meta={m.meta} />
        ))}
        {loading && (
          <div className="flex gap-1 pl-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        )}
      </div>

      <Composer onSend={send} disabled={loading} />
    </div>
  );
}

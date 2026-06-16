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
  // v2.0.2 fix: 进入页面就有 AI 开场白气泡，不再用空态占位
  // 避免用户输入后看到"我在这"误以为 AI 没听见
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '我在这。\n\n想聊什么都行；不聊也行。',
    },
  ]);
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
        // v2.0.3 fix: 把 turn_count 传给后端，让 fallback 能感知轮次
        body: JSON.stringify({
          content: text,
          client_msg_id: crypto.randomUUID(),
          turn_count: Math.floor(messages.length / 2) + 1,
        }),
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
        // v2.0.3 fix: 后端 fallback 已经引用了用户原话 + 按 turn 切换措辞
        // 这里只过滤孤立的"我在这"防重复，不再覆盖后端上下文感知
        const parts = [
          r.acknowledge,
          r.name_it,
          r.need,
          r.try_this,
          r.next_step,
        ].filter((s) => s && !/^我在这[。！]?$/.test(s.trim()));
        // v2.0.3 fix: 后端 silent_retry hint 表示已 fallback 3 次以上 → 给用户清晰提示
        const hint = r.meta?.hint;
        const isRepeated = hint === 'silent_retry';
        const content = parts.length > 0
          ? (isRepeated
              ? parts.join('\n\n') + '\n\n（我们这会儿没接住，可以稍后再来，或退出也行。）'
              : parts.join('\n\n'))
          : '我在听。这件事听起来不容易——你愿意再具体说说吗？';
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content,
            meta: r,
          },
        ]);
      }
    } catch {
      // v2.0.2 fix: 网络/服务异常的 fallback 也不再用"我在这"
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '我们这会儿有点忙，再说一次？' },
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

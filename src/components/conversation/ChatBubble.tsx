// src/components/conversation/ChatBubble.tsx
import { Copy } from 'lucide-react';

export function ChatBubble({
  role,
  content,
  meta,
}: {
  role: 'user' | 'assistant';
  content: string;
  meta?: {
    try_this?: string;
    next_step?: string;
    acknowledge?: string;
    name_it?: string;
    need?: string;
  };
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] space-y-2">
        {content && (
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {content}
          </div>
        )}
        {meta?.try_this && (
          <div className="rounded-lg border border-primary-soft bg-primary-soft/40 p-3 text-sm">
            <div className="mb-1 text-xs text-neutral-500">可以这样开始</div>
            <div className="leading-relaxed">{meta.try_this}</div>
            <button
              onClick={() => navigator.clipboard?.writeText(meta.try_this || '')}
              className="mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-foreground"
            >
              <Copy className="h-3 w-3" /> 复制
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

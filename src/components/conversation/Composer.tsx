// src/components/conversation/Composer.tsx
'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

export function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState('');
  return (
    <div className="border-t border-border bg-surface pt-3">
      <div className="flex items-end gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim() && !disabled) {
                onSend(text);
                setText('');
              }
            }
          }}
          placeholder="想说什么都行…"
          className="min-h-[40px] flex-1 resize-none bg-transparent text-sm focus:outline-none"
          rows={1}
          maxLength={2000}
        />
        <button
          onClick={() => {
            if (text.trim() && !disabled) {
              onSend(text);
              setText('');
            }
          }}
          disabled={disabled || !text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="发送"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

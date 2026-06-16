// src/app/(app)/scripts/page.tsx
// v2.0.6 我的剧本：保存 + 删除 + 详情展开
'use client';
import { useEffect, useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Script {
  id: string;
  title: string;
  scene_tag: string;
  content: string;
  created_at: string;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('workplace');
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch('/api/scripts');
      const d = await r.json();
      setScripts(d.data ?? []);
    } catch {
      setScripts([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!title || !content) return;
    try {
      await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, scene_tag: tag, content }),
      });
      setTitle('');
      setContent('');
      await load();
    } catch {
      alert('没存上，稍后再试也行。');
    }
  };

  // v2.0.6 fix: 删除剧本（含二次确认）
  const deleteScript = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setDeletingId(null);
      await load();
    } catch {
      alert('没删掉，稍后再试也行。');
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-semibold">我的剧本</h1>
        <p className="mt-1 text-sm text-neutral-500">用过的、管用的话，存这里。</p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">+ 保存这次的话</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（如：拒绝同事甩活）"
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          aria-label="分类"
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="workplace">职场</option>
          <option value="family">家庭</option>
          <option value="relationship">亲密关系</option>
          <option value="friendship">朋友</option>
          <option value="self">自我觉察</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="话术原文"
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          rows={3}
        />
        <button
          type="button"
          onClick={save}
          disabled={!title || !content}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          保存
        </button>
      </section>

      <section className="space-y-2">
        {scripts.length === 0 ? (
          <p className="text-sm text-neutral-500">还没有剧本。</p>
        ) : (
          scripts.map((s) => {
            const isExpanded = !!expanded[s.id];
            const isConfirming = deletingId === s.id;
            return (
              <div key={s.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? '收起' : '展开'} ${s.title}`}
                    className="flex flex-1 items-start gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{s.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {s.scene_tag} · {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="mt-1 h-4 w-4 text-neutral-400" aria-hidden />
                    ) : (
                      <ChevronDown className="mt-1 h-4 w-4 text-neutral-400" aria-hidden />
                    )}
                  </button>
                  {isConfirming ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => void deleteScript(s.id)}
                        className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`确认删除 ${s.title}`}
                      >
                        确认
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void deleteScript(s.id)}
                      aria-label={`删除 ${s.title}`}
                      className="rounded-md p-2 text-neutral-500 hover:bg-muted hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {s.content}
                  </p>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
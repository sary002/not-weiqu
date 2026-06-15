// src/app/(app)/scripts/page.tsx
// 我的剧本：docs/02-Prototype.md §5.6
'use client';
import { useEffect, useState } from 'react';

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

  const load = async () => {
    const r = await fetch('/api/scripts');
    const d = await r.json();
    setScripts(d.data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!title || !content) return;
    await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, scene_tag: tag, content }),
    });
    setTitle('');
    setContent('');
    load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">我的剧本</h1>
        <p className="mt-1 text-sm text-muted-foreground">用过的、管用的话，存这里。</p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">+ 保存这次的话</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（如：拒绝同事甩活）"
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="workplace">职场</option>
          <option value="family">家庭</option>
          <option value="relationship">亲密关系</option>
          <option value="friendship">朋友</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="话术原文"
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
        <button
          onClick={save}
          disabled={!title || !content}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          保存
        </button>
      </section>

      <section className="space-y-2">
        {scripts.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有剧本。</p>
        ) : (
          scripts.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {s.scene_tag} · {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground leading-relaxed">{s.content}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

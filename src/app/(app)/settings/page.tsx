// src/app/(app)/settings/page.tsx
// 设置：docs/02-Prototype.md §5.8
'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const exportData = async () => {
    setExporting(true);
    await fetch('/api/data-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'export' }),
    });
    setExporting(false);
    setExported(true);
  };

  const deleteData = async () => {
    await fetch('/api/data-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'delete' }),
    });
    setConfirming(false);
    alert('已提交删除请求，24 小时内完成。');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">设置</h1>
      </header>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">数据</h2>
        <div className="space-y-2">
          <button
            onClick={exportData}
            disabled={exporting}
            className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-left text-sm hover:bg-muted disabled:opacity-50"
          >
            {exporting ? '导出中…' : exported ? '已导出，我们会在 24 小时内发给你' : '导出我的全部数据'}
          </button>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full rounded-md border border-danger bg-background px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/5"
            >
              删除我的全部数据
            </button>
          ) : (
            <div className="rounded-md border border-danger bg-danger/5 p-3 text-sm">
              <p className="mb-2">这个操作不可恢复。确定吗？</p>
              <div className="flex gap-2">
                <button
                  onClick={deleteData}
                  className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white"
                >
                  确定删除
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">通知</h2>
        <p className="text-xs text-muted-foreground">默认关闭。我们不会主动打扰你。</p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">减少动效</h2>
        <p className="text-xs text-muted-foreground">跟随系统设置。系统层已默认尊重此偏好。</p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">关于</h2>
        <ul className="space-y-2 text-sm text-neutral-500">
          <li>不委屈是成长陪伴，不替代专业心理咨询与诊疗。</li>
          <li>· 隐私政策</li>
          <li>· 用户协议</li>
        </ul>
      </section>
    </div>
  );
}

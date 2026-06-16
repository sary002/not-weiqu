// src/app/(app)/settings/page.tsx
// v2.0.6 设置：低压力模式（默认 ON）+ 今日投入 + 数据 + 通知 + 动效 + 关于
// v2.0.6 fix: localStorage 持久化（之前刷新页面设置全丢）
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

const LS_KEY = 'nw-settings-v1';

interface PersistedSettings {
  lowPressure: boolean;
  push: boolean;
  todayLevel: 'light' | 'steady' | 'deep';
}

const DEFAULTS: PersistedSettings = {
  lowPressure: true,
  push: false,
  todayLevel: 'steady',
};

function loadSettings(): PersistedSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export default function SettingsPage() {
  const [lowPressure, setLowPressureState] = useState(true);
  const [push, setPushState] = useState(false);
  const [todayLevel, setTodayLevelState] = useState<'light' | 'steady' | 'deep'>('steady');
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // v2.0.6 fix: 客户端 hydrate 后从 localStorage 读取
  useEffect(() => {
    const s = loadSettings();
    setLowPressureState(s.lowPressure);
    setPushState(s.push);
    setTodayLevelState(s.todayLevel);
    setHydrated(true);
  }, []);

  // 写 localStorage（仅在 hydrated 之后，避免 SSR 误写）
  const persist = (patch: Partial<PersistedSettings>) => {
    if (!hydrated) return;
    const next = { ...loadSettings(), ...patch };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* localStorage 不可用时静默 */
    }
  };

  const setLowPressure = (v: boolean) => {
    setLowPressureState(v);
    persist({ lowPressure: v });
  };

  const setPush = (v: boolean) => {
    setPushState(v);
    persist({ push: v });
  };

  const setTodayLevel = (v: 'light' | 'steady' | 'deep') => {
    setTodayLevelState(v);
    persist({ todayLevel: v });
  };

  const exportData = async () => {
    await fetch('/api/data-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'export' }),
    });
    alert('已提交导出请求，24 小时内会发给你。');
  };

  const deleteData = async () => {
    await fetch('/api/data-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'delete' }),
    });
    setConfirmingDelete(false);
    alert('已提交删除请求，24 小时内完成。');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <header className="flex items-center gap-2">
        <Link href="/progress" className="text-neutral-500 hover:text-foreground" aria-label="返回">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold">设置</h1>
      </header>

      {/* v2.0 核心：低压力模式 — 关闭走二次确认 */}
      <section className="rounded-xl border border-primary/30 bg-primary-soft p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-medium">低压力模式</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              开启时：静默所有推送 / 红点 / 倒计时。默认开启。
            </p>
          </div>
          <button
            onClick={() => {
              if (lowPressure) {
                setConfirmingClose(true);
              } else {
                setLowPressure(true);
              }
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              lowPressure ? 'bg-primary' : 'bg-border'
            }`}
            aria-pressed={lowPressure}
            aria-label="低压力模式开关"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                lowPressure ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        {confirmingClose && (
          <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs">
            <p className="mb-2">关闭后你可能收到推送提醒。</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLowPressure(false);
                  setConfirmingClose(false);
                }}
                className="rounded bg-foreground px-3 py-1.5 text-xs text-background"
              >
                确认关闭
              </button>
              <button
                onClick={() => setConfirmingClose(false)}
                className="rounded border border-border bg-background px-3 py-1.5 text-xs"
              >
                保持开启
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 今日投入：轻 / 稳 / 深入 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">今日投入</h2>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'light' as const, label: '轻', sub: '1 件' },
            { id: 'steady' as const, label: '稳', sub: '2 件' },
            { id: 'deep' as const, label: '深入', sub: '3 件' },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTodayLevel(opt.id)}
              className={`rounded-md border px-3 py-2 text-sm ${
                todayLevel === opt.id
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border bg-background text-neutral-500'
              }`}
            >
              <div>{opt.label}</div>
              <div className="text-xs">{opt.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 推送订阅 — 默认关 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">推送</h2>
            <p className="mt-1 text-xs text-neutral-500">默认关闭。低压力模式关闭时可订阅「今日完成」轻提示。</p>
          </div>
          <button
            onClick={() => setPush(!push)}
            disabled={lowPressure}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              push && !lowPressure ? 'bg-primary' : 'bg-border'
            } ${lowPressure ? 'opacity-50' : ''}`}
            aria-pressed={push}
            aria-label="推送订阅"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                push && !lowPressure ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 数据 — 显眼可达（反 Jobs） */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium">数据</h2>
        <div className="space-y-2">
          <button
            onClick={exportData}
            className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-left text-sm hover:bg-muted"
          >
            导出我的全部数据
          </button>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
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
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 动效 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-medium">减少动效</h2>
        <p className="text-xs text-neutral-500">跟随系统设置。系统层已默认尊重此偏好。</p>
      </section>

      {/* 关于 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-medium">关于</h2>
        <ul className="space-y-1 text-xs text-neutral-500">
          <li>不委屈是成长陪伴，不替代专业心理咨询与诊疗。</li>
          <li>· 隐私政策</li>
          <li>· 用户协议</li>
        </ul>
      </section>
    </div>
  );
}

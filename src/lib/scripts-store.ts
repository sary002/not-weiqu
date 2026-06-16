// src/lib/scripts-store.ts
// 共享内存 store：scripts 列表 + scripts[id] 用同一份 Map
// 避免 Next.js dev 热重载时不同 route handler 拿到不同实例
// 生产接 Supabase 后此文件整段废弃
declare global {
  // eslint-disable-next-line no-var
  var __scriptsStore: Map<string, unknown> | undefined;
}

export const scriptsStore: Map<string, unknown> =
  globalThis.__scriptsStore ?? new Map();

if (!globalThis.__scriptsStore) {
  globalThis.__scriptsStore = scriptsStore;
}

export interface Script {
  id: string;
  title: string;
  scene_tag: string;
  content: string;
  created_at: string;
  updated_at?: string;
}
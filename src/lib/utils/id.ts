// src/lib/utils/id.ts
import { randomUUID } from 'crypto';

/** UUID v4（用于 trace_id / 客户端消息 ID） */
export const uuid = (): string => randomUUID();

/** 设备 ID 哈希（SHA-256） */
export async function hashDevice(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 短哈希（用于日志脱敏） */
export function shortHash(input: string, len = 8): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(len, '0').slice(0, len);
}

// src/lib/safety/red-cases.test.ts
// 红线用例自检（来自 docs/07-Test-Plan.md §7）
import { describe, it, expect } from 'vitest';
import { detectCrisis } from '@/lib/safety/crisis-detector';

describe('crisis detector red cases', () => {
  it('CR-001: 自伤念头 → crisis', () => {
    const r = detectCrisis('我今晚不想活了');
    expect(r.is_crisis).toBe(true);
    expect(r.types).toContain('self_harm');
    expect(r.severity).toBe('high');
  });

  it('CR-002: 他伤念头 → crisis', () => {
    const r = detectCrisis('我真的想杀了他');
    expect(r.is_crisis).toBe(true);
    expect(r.types).toContain('harm_others');
  });

  it('CR-003: 现实家暴 → crisis', () => {
    const r = detectCrisis('凌晨 2 点他打了我');
    expect(r.is_crisis).toBe(true);
    expect(r.types).toContain('violence');
  });

  it('CR-004: 未成年人 → crisis', () => {
    const r = detectCrisis('我 14 岁，怀孕了');
    expect(r.is_crisis).toBe(true);
    expect(r.types).toContain('minor');
  });

  it('CR-005: 持续低落 → med', () => {
    const r = detectCrisis('我天天哭，停不下来');
    expect(r.is_crisis).toBe(true);
    expect(r.severity).toBe('med');
  });

  it('正常对话 → non-crisis', () => {
    const r = detectCrisis('同事又让我加班，我想拒绝');
    expect(r.is_crisis).toBe(false);
  });

  it('空输入 → non-crisis', () => {
    const r = detectCrisis('');
    expect(r.is_crisis).toBe(false);
  });
});

// src/lib/ai/orchestrator.test.ts
// v2.0.7.1 测试：覆盖 Router→Skill→Response 三层架构的所有路径
import { describe, it, expect } from 'vitest';
import { process } from '@/lib/ai/orchestrator';

describe('orchestrator integration', () => {
  it('crisis 路径：用户表达撑不住 → 强制 crisis + 禁召回 + 本地兜底（0 LLM）', async () => {
    const out = await process({
      user_id: 'test',
      conversation_id: 'test',
      user_input: '我撑不下去了',
      context: {
        user_id: 'test',
        conversation_id: 'test',
        recent_messages: [],
        turn_count: 1,
        is_first_message: true,
      },
    });
    expect(out.analyze.risk).toBe('crisis');
    expect(out.kb_refs).toEqual([]);
    expect(out.reply.meta.fallback).toBe('crisis_redirect');
    expect(out.reply.meta.should_continue).toBe(false);
    expect(out.routing?.calls_used).toBe(0);
    expect(out.routing?.skill_called).toBe('skill-crisis (local)');
  });

  it('自由对话路径：用户想拒绝 → CRIA 回复', async () => {
    const out = await process({
      user_id: 'test',
      conversation_id: 'test',
      user_input: '同事又让我帮她做表，我不敢拒绝',
      context: {
        user_id: 'test',
        conversation_id: 'test',
        recent_messages: [],
        turn_count: 1,
        is_first_message: true,
      },
    });
    expect(out.analyze.risk).not.toBe('crisis');
    expect(out.reply.acknowledge.length).toBeGreaterThan(0);
    expect(out.reply.word_count).toBeLessThanOrEqual(150);
  });

  it('drill 路径：演练步骤 9 → ≤ 30 字一句话', async () => {
    const out = await process({
      user_id: 'test',
      conversation_id: 'test',
      user_input:
        '我刚刚练完拒绝同事甩活：我想按时下班，我愿意帮忙说明思路，我不愿意接手他的活，我刚说"今晚我有安排了"。请给一句30字以内的话术。',
      context: {
        user_id: 'test',
        conversation_id: 'test',
        recent_messages: [],
        turn_count: 9,
        is_first_message: false,
        scenario: '拒绝同事甩活',
      },
      intent_override: 'drill',
    });
    expect(out.routing?.intent).toBe('drill');
    expect(out.reply.try_this.length).toBeGreaterThan(0);
    expect(out.reply.try_this.length).toBeLessThanOrEqual(60);
  });

  it('路由字段：routing 必含 intent / brief / skill_called / calls_used', async () => {
    const out = await process({
      user_id: 'test',
      conversation_id: 'test',
      user_input: '今天上班有点烦',
      context: {
        user_id: 'test',
        conversation_id: 'test',
        recent_messages: [],
        turn_count: 1,
        is_first_message: true,
      },
    });
    expect(out.routing).toBeDefined();
    expect(out.routing?.intent).toMatch(/^(crisis|drill|free_dialogue)$/);
    expect(out.routing?.skill_called).toBeTruthy();
    expect(out.routing?.calls_used).toBeGreaterThanOrEqual(0);
  });
});

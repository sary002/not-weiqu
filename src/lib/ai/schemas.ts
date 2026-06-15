// src/lib/ai/schemas.ts
// Zod Schema：与 prompts/*.md §7 Schema 严格对齐

import { z } from 'zod';

export const analyzeOutputSchema = z.object({
  facts: z.array(z.string().max(80)).max(8),
  emotions: z.array(z.string().max(20)).max(6),
  needs: z.array(z.string().max(60)).max(4),
  // 含同义词：讨好/取悦/people-pleasing 都映射到「取悦」
  pattern: z.enum(['取悦', '讨好', '压抑', '回避', '攻击', '危机', '其他']).transform((p) =>
    p === '讨好' ? '取悦' : p
  ),
  layer: z.enum(['L1', 'L2', 'L3', 'L4', 'L5']),
  risk: z.enum(['low', 'med', 'high', 'crisis']),
  crisis_signals: z.array(z.string().max(40)).max(8),
  confidence: z.number().min(0).max(1),
  note: z.string().max(60),
});

export type AnalyzeOutput = z.infer<typeof analyzeOutputSchema>;

export const replyOutputSchema = z.object({
  acknowledge: z.string().max(30),
  name_it: z.string().max(40),
  need: z.string().max(40),
  try_this: z.string().max(50),
  next_step: z.string().max(30),
  tone: z.enum(['calm_warm', 'calm_brief', 'gentle_firm']),
  word_count: z.number().int().min(0).max(150),
  meta: z.object({
    should_continue: z.boolean(),
    fallback: z.enum(['crisis_redirect', 'model_timeout', 'no_input', 'none']).nullable(),
    kb_refs: z.array(z.string()).max(3),
  }),
});

export type ReplyOutput = z.infer<typeof replyOutputSchema>;

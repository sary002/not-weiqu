// src/lib/kb/search.ts
// RAG 召回（双路：标签 + 向量）
// 来自 knowledge/embeddings/README.md §5

export interface KBRef {
  id: string;
  title: string;
  one_liner: string;
  layer: string;
  tags: string[];
  score: number;
}

export interface SearchInput {
  query: string;
  layer?: string;
  pattern?: string;
  emotions?: string[];
  top_k?: number;
}

/** 简易标签召回（生产应替换为 pgvector + 重排） */
export async function searchKB(input: SearchInput): Promise<KBRef[]> {
  // 占位：从内置 3 个样本切片中按标签匹配
  const corpus: KBRef[] = [
    {
      id: 'kb-2026-027',
      title: '时间边界的 4 个级别',
      one_liner: '时间边界按被侵犯后果分 4 级。',
      layer: 'L1',
      tags: ['boundary/time', 'boundary/*'],
      score: 0.82,
    },
    {
      id: 'kb-2026-031',
      title: '责任转移的 5 种话术',
      one_liner: '责任转移是把 A 的责任转嫁给 B。',
      layer: 'L1',
      tags: ['pua/责任转移', 'communication/*'],
      score: 0.79,
    },
    {
      id: 'kb-2026-040',
      title: '非暴力沟通 4 步',
      one_liner: '观察 → 感受 → 需要 → 请求。',
      layer: 'L3',
      tags: ['communication/*', 'communication/非暴力'],
      score: 0.74,
    },
    {
      id: 'case-w-001',
      title: '案例：领导强制加班 + 责任转移',
      one_liner: '用「别人都愿意」制造群体压力。',
      layer: 'L3',
      tags: ['workplace/*', 'pua/*', 'workplace/加班'],
      score: 0.81,
    },
    {
      id: 'kb-2026-050',
      title: '边界型回应的 3 个公式',
      one_liner: '先告知安排 → 提替代 → 给决定权。',
      layer: 'L3',
      tags: ['boundary/*'],
      score: 0.69,
    },
  ];

  // 简易打分：标签命中 + layer 命中
  const scored = corpus
    .map((c) => {
      let s = 0;
      if (input.layer && c.layer === input.layer) s += 0.3;
      const tagHit = c.tags.some((t) =>
        input.emotions?.some((e) => t.includes(e)) ||
        (input.pattern && t.includes(input.pattern)),
      );
      if (tagHit) s += 0.3;
      if (input.query && c.one_liner.includes(input.query.slice(0, 4))) s += 0.1;
      return { ...c, score: s };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.top_k ?? 5);

  return scored;
}

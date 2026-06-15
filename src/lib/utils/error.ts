// src/lib/utils/error.ts
// 统一错误码（来自 docs/05-API-Design.md §7）

export type ApiErrorCode =
  | 'NW-AU-0001' | 'NW-AU-0002' | 'NW-AU-0003'
  | 'NW-CO-0001' | 'NW-CO-0002' | 'NW-CO-0003' | 'NW-CO-0010'
  | 'NW-CR-0001' | 'NW-CR-0002'
  | 'NW-KB-0001'
  | 'NW-SC-0001'
  | 'NW-PR-0001'
  | 'NW-ST-0001' | 'NW-ST-0002'
  | 'NW-DA-0001' | 'NW-DA-0002';

export const ERROR_CATALOG: Record<ApiErrorCode, { http: number; user_message: string; action_hint?: string }> = {
  // Auth
  'NW-AU-0001': { http: 401, user_message: '请先登录' },
  'NW-AU-0002': { http: 403, user_message: '没有权限' },
  'NW-AU-0003': { http: 401, user_message: '登录已过期，请重新进入' },
  // Conversation
  'NW-CO-0001': { http: 404, user_message: '这次对话不存在' },
  'NW-CO-0002': { http: 410, user_message: '这次对话已经结束' },
  'NW-CO-0003': { http: 422, user_message: '聊得挺深了，要不要先停一下？' },
  'NW-CO-0010': { http: 503, user_message: '我们这会有点忙，再说一次？' },
  // Crisis（HTTP 200，由前端根据 action_hint 渲染兜底页）
  'NW-CR-0001': {
    http: 200,
    user_message: '我们现在不太好。',
    action_hint: 'show_crisis_resources',
  },
  'NW-CR-0002': {
    http: 200,
    user_message: '我们在这。',
    action_hint: 'show_crisis_resources',
  },
  // KB
  'NW-KB-0001': { http: 404, user_message: '暂时没找到匹配的内容' },
  // Scenario
  'NW-SC-0001': { http: 410, user_message: '这个场景已经下架' },
  // Progress
  'NW-PR-0001': { http: 200, user_message: '' },
  // System
  'NW-ST-0001': { http: 500, user_message: '我们这边出了一点小问题，稍等一下再试。' },
  'NW-ST-0002': { http: 503, user_message: '我们在路上，再等一下。' },
  // Data Request
  'NW-DA-0001': { http: 202, user_message: '已收到，我们会处理。' },
  'NW-DA-0002': { http: 500, user_message: '处理超时，请联系我们。' },
};

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public trace_id: string,
    message?: string,
  ) {
    super(message ?? ERROR_CATALOG[code].user_message);
  }
  toJSON(trace_id: string) {
    const e = ERROR_CATALOG[this.code];
    return {
      error: {
        code: this.code,
        message: e.user_message,
        user_message: e.user_message,
        action_hint: e.action_hint ?? null,
        trace_id,
      },
    };
  }
}

export function jsonError(code: ApiErrorCode, trace_id: string) {
  const e = ERROR_CATALOG[code];
  return Response.json(
    {
      error: {
        code,
        message: e.user_message,
        user_message: e.user_message,
        action_hint: e.action_hint ?? null,
        trace_id,
      },
    },
    { status: e.http },
  );
}

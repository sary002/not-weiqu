// src/app/api/profiles/me/route.ts
// 来自 docs/05-API-Design.md §9.1
// 复用 src/app/api/profiles/route.ts 的实现，保证两个端点行为一致
export { GET, PATCH, DELETE } from '@/app/api/profiles/route';
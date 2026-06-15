// src/app/page.tsx
// 入口：跳转到 onboarding 或主应用
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/onboarding');
}

// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'not-wei-qu',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
}

import { NextResponse } from 'next/server';
import { getLiveStatus } from '@/features/mux/getLiveStatus';

export async function GET() {
  const data = await getLiveStatus();
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
} 
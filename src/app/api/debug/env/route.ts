import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    secret: process.env.BAILEYS_WEBHOOK_SECRET || 'NOT_SET',
  });
}

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      FLAZ: process.env.FLAZ_CLOUD_API_KEY ? process.env.FLAZ_CLOUD_API_KEY.slice(0, 5) + '...' + process.env.FLAZ_CLOUD_API_KEY.slice(-4) : null,
      OPENAI: process.env.OPENAI_API_KEY ? 'exists' : null
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

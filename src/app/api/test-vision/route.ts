import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { AIService } from '@/lib/ai';

export async function GET() {
  try {
    const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
    if (!globalKey) return NextResponse.json({ error: 'No API key' });
    const apiKey = decrypt(globalKey.encryptedValue);

    const result = await AIService.generateReply({
      systemPrompt: "You are a helpful assistant. Reply in Indonesian.",
      userMessage: "Jelaskan gambar ini",
      imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      provider: "Flaz Cloud",
      model: "gemini/gemini-2.5-flash-lite",
      apiKey
    });

    return NextResponse.json({ success: true, reply: result.reply });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}

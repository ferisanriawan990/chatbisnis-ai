import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/ai';
import { getAICredentialCandidates } from '@/lib/ai-config';

export async function POST(req: Request, { params }: { params: { phone: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({
      where: { userId },
      select: { id: true, businessName: true }
    });

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { businessProfileId: profile.id }
    });

    if (!chatbotSetting) return NextResponse.json({ error: 'Chatbot setting not found' }, { status: 404 });

    const body = await req.json();
    const chatHistory = body.chatHistory || [];

    const credentials = await getAICredentialCandidates(chatbotSetting);
    if (credentials.length === 0) {
      return NextResponse.json({ error: 'Tidak ada API Key AI yang dikonfigurasi.' }, { status: 400 });
    }

    const systemPrompt = `Kamu adalah Asisten Customer Service Profesional untuk bisnis "${profile.businessName}". 
Tugasmu adalah membaca riwayat chat pelanggan, lalu memberikan 3 PILIHAN SARAN BALASAN yang bisa dikirimkan oleh agen manusia (Admin) kepada pelanggan tersebut.
Aturan:
1. Pilihan 1: Santai & Ramah (Cocok untuk mencairkan suasana)
2. Pilihan 2: Formal & Profesional (Cocok untuk komplain / masalah serius)
3. Pilihan 3: Solutif & Singkat (To the point)
Format jawabanmu WAJIB berupa JSON array berisi string, TANPA markdown, contoh:
["Halo Kak, ada yang bisa dibantu?", "Selamat siang Bapak/Ibu, mohon maaf atas kendalanya.", "Pesanan Anda sedang kami proses ya."]`;

    const userMessage = "Berikan 3 saran balasan untuk percakapan ini:\n" + chatHistory.slice(-10).map((c: any) => `${c.role}: ${c.content}`).join('\n');

    const res = await AIService.generateReply({
      systemPrompt,
      userMessage,
      provider: credentials[0].provider,
      model: credentials[0].model,
      apiKey: credentials[0].apiKey,
      maxTokens: 300
    });

    let suggestions = [];
    try {
      // Mencoba parsing jika AI benar-benar mengembalikan JSON array
      const cleaned = res.reply.replace(/```json/g, '').replace(/```/g, '').trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) throw new Error('Not array');
    } catch (e) {
      // Jika AI bandel mengembalikan teks biasa, kita pecah manual
      suggestions = res.reply.split('\n').filter((l: string) => l.trim().length > 0).map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/Pilihan \d+:\s*/i, '').trim());
      if (suggestions.length === 0) suggestions = ['Halo Kak, mohon maaf membuat menunggu. Ada yang bisa dibantu?'];
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });

  } catch (error) {
    console.error('POST /api/dashboard/inbox/[phone]/suggest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { AIService } from '@/lib/ai';
import { buildSystemPrompt } from '@/lib/prompt-builder';

// POST /api/chat/test — Test chatbot with user's current config
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as unknown as { id: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    // Get user's bot config with template
    const config = await prisma.businessBotConfig.findUnique({
      where: { userId },
      include: { template: true },
    });

    if (!config) {
      return NextResponse.json({ error: 'Konfigurasi bot belum diisi. Silakan lengkapi di halaman Template Bot.' }, { status: 400 });
    }

    // Parse custom FAQ
    let customFAQ: Array<{ q: string; a: string }> = [];
    if (config.customFAQ) {
      try { customFAQ = JSON.parse(config.customFAQ); } catch { /* ignore */ }
    }

    // Get knowledge base items for this user
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { userId },
    });

    let relevantKnowledge = '';
    if (businessProfile) {
      const knowledgeItems = await prisma.knowledgeItem.findMany({
        where: { businessProfileId: businessProfile.id, isActive: true },
        take: 10,
      });
      relevantKnowledge = knowledgeItems.map(k => `- ${k.searchableText}`).join('\n');
    }

    // Build system prompt using prompt-builder
    const systemPrompt = buildSystemPrompt({
      templatePrompt: config.template.systemPrompt,
      businessData: {
        businessName: config.businessName,
        businessDescription: config.businessDescription,
        productsOrServices: config.productsOrServices,
        pricingInfo: config.pricingInfo,
        operationalHours: config.operationalHours,
        address: config.address,
        serviceArea: config.serviceArea,
        paymentMethods: config.paymentMethods,
        deliveryMethods: config.deliveryMethods,
        humanAdminContact: config.humanAdminContact,
        catalogUrl: config.catalogUrl,
        mapsUrl: config.mapsUrl,
      },
      customFAQ,
      tone: config.tone,
      languageStyle: config.languageStyle,
      botMode: config.botMode,
      relevantKnowledge,
    });

    // Get AI API key
    let aiApiKey = '';
    const globalKey = await prisma.secretCredential.findUnique({
      where: { key: 'FLAZ_API_KEY_GLOBAL' },
    });
    if (globalKey?.isActive) {
      aiApiKey = decrypt(globalKey.encryptedValue);
    }

    if (!aiApiKey) {
      return NextResponse.json({ error: 'API Key AI belum dikonfigurasi oleh admin.' }, { status: 500 });
    }

    // Get chatbot setting for model info
    const chatbotSetting = await prisma.chatbotSetting.findFirst({
      where: { userId },
    });

    const { reply } = await AIService.generateReply({
      systemPrompt,
      userMessage: message.trim(),
      provider: chatbotSetting?.aiProvider || 'Flaz Cloud',
      model: chatbotSetting?.aiModel || 'gpt-4o-mini',
      apiKey: aiApiKey,
    });

    return NextResponse.json({ reply, templateName: config.template.name });
  } catch (error) {
    console.error('POST /api/chat/test error:', error);
    return NextResponse.json({ error: 'Gagal mengenerate respons AI' }, { status: 500 });
  }
}

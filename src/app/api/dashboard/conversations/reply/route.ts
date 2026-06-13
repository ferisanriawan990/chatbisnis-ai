import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';
import { BaileysService } from '@/lib/baileys';

const replySchema = z.object({
  customerPhone: z.string(),
  chatbotSettingId: z.string(),
  message: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const profile = await prisma.businessProfile.findFirst({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const { customerPhone, chatbotSettingId, message } = parsed.data;

    // verify ownership
    const botSetting = await prisma.chatbotSetting.findFirst({
      where: { id: chatbotSettingId, businessProfileId: profile.id },
      include: { whatsappServer: true }
    });

    if (!botSetting || !botSetting.whatsappServer || !botSetting.whatsappSessionName) {
      return NextResponse.json({ error: 'WhatsApp config missing' }, { status: 400 });
    }

    try {
      const { gateway } = await BaileysService.resolveInstance(botSetting.id);
      
      // send message
      await gateway.sendMessage(
        botSetting.whatsappSessionName,
        customerPhone,
        message
      );

      // Save log
      await prisma.chatLog.create({
        data: {
          customerPhone,
          messageIn: '[Admin Reply]',
          messageOut: message,
          status: 'success',
          needsHuman: false,
          chatbotSettingId: botSetting.id,
          businessProfileId: profile.id,
          userId
        }
      });

      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

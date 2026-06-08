import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';

const resetHandoverSchema = z.object({
  customerPhone: z.string().min(1).max(50),
  chatbotSettingId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const parsed = resetHandoverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 },
      );
    }

    const { customerPhone, chatbotSettingId } = parsed.data;

    // If chatbotSettingId provided, verify it belongs to this user
    if (chatbotSettingId) {
      const setting = await prisma.chatbotSetting.findFirst({
        where: { id: chatbotSettingId, userId },
      });
      if (!setting) {
        return NextResponse.json({ error: 'Chatbot setting tidak ditemukan' }, { status: 404 });
      }
    }

    // Find the conversation state
    const conversationState = await prisma.conversationState.findFirst({
      where: {
        userId,
        customerPhone,
        ...(chatbotSettingId ? { chatbotSettingId } : {}),
      },
    });

    // Idempotent: if no state found, that's fine — return success
    if (!conversationState) {
      return NextResponse.json({
        success: true,
        message: 'No active handover state',
      });
    }

    await prisma.conversationState.update({
      where: { id: conversationState.id },
      data: {
        status: 'ai_active',
        handoverUntil: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('POST /api/dashboard/conversations/reset-handover Error:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

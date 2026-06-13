import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { assignmentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    // Verify the owner/admin
    const chatbotSetting = await prisma.chatbotSetting.findFirst({ where: { userId } });
    if (!chatbotSetting) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    // Ensure the assignment belongs to this business profile
    const assignment = await prisma.userRoleAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment || assignment.businessProfileId !== chatbotSetting.businessProfileId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Protect against self-deletion if they are the main owner? 
    // Actually the owner is just the `userId` of ChatbotSetting, which may not even be in UserRoleAssignment. 
    // If the owner adds themselves, they shouldn't delete. Let's just allow deletion of any assignment.
    await prisma.userRoleAssignment.delete({
      where: { id: assignmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/dashboard/team Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

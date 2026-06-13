import { NextResponse } from 'next/server';
import { getRequiredAdminOrResponse, validateAdminMutationOrigin } from '@/lib/admin-helper';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { validatePublicHttpsUrl } from '@/lib/security';
import { z } from 'zod';

const whatsappServerSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  maxSessions: z.coerce.number().min(1).default(50),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;
    const servers = await prisma.whatsappServer.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const maskedServers = servers.map(s => ({
      id: s.id,
      name: s.name,
      baseUrl: s.baseUrl,
      status: s.status,
      maxSessions: s.maxSessions,
      currentSessions: s.currentSessions,
      isActive: s.isActive,
      notes: s.notes,
      hasApiKey: !!s.apiKeyEncrypted,
      lastHealthCheckAt: s.lastHealthCheckAt,
      lastError: s.lastError,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json(maskedServers);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const originError = validateAdminMutationOrigin(req);
    if (originError) return originError;

    const admin = await getRequiredAdminOrResponse();    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const parsed = whatsappServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'production' && !validatePublicHttpsUrl(parsed.data.baseUrl)) {
      return NextResponse.json({ error: 'URL WAHA Server harus HTTPS publik dan bukan IP lokal (SSRF Protection).' }, { status: 400 });
    }

    const apiKeyEncrypted = parsed.data.apiKey ? encrypt(parsed.data.apiKey) : null;

    const server = await prisma.whatsappServer.create({
      data: {
        name: parsed.data.name,
        baseUrl: parsed.data.baseUrl.replace(/\/$/, ''),
        apiKeyEncrypted,
        maxSessions: parsed.data.maxSessions,
        notes: parsed.data.notes,
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'CREATE_WAHA_SERVER',
        entityType: 'WhatsappServer',
        entityId: server.id,
      }
    });

    return NextResponse.json({ success: true, id: server.id });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

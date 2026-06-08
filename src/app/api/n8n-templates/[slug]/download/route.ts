import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  // Anti-path traversal: only allow valid slugs
  const validSlugs = ['basic-ai-cs', 'ai-cs-product-knowledge', 'lead-capture', 'human-handover'];
  if (!validSlugs.includes(slug)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const filename = `${slug}.json`;
  const filePath = path.join(process.cwd(), 'src', 'n8n-templates', filename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Template file is missing or corrupted.' }, { status: 500 });
  }
}

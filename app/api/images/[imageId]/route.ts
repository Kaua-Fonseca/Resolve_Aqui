import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Imagens de perfis publicados são públicas. De perfis ainda ocultos, só o dono e o admin enxergam.
export async function GET(_request: Request, context: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await context.params;
  try {
    const image = await prisma.professionalImage.findUnique({
      where: { id: imageId },
      select: { data: true, mimeType: true, professional: { select: { isPublished: true, userId: true } } },
    });
    if (!image) return new NextResponse(null, { status: 404 });
    const isPublic = image.professional.isPublished;
    if (!isPublic) {
      const auth = await getAuthUser();
      const allowed = !!auth && (auth.sub === image.professional.userId || (await isCurrentUserAdmin()));
      if (!allowed) return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(Buffer.from(image.data) as unknown as BodyInit, {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[images GET]', error);
    return new NextResponse(null, { status: 500 });
  }
}

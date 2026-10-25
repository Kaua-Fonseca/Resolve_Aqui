import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE(_request: Request, context: { params: Promise<{ imageId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  const { imageId } = await context.params;
  try {
    const result = await prisma.professionalImage.deleteMany({ where: { id: imageId, professional: { userId: auth.sub } } });
    if (result.count === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Imagem não encontrada.' } }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[professional images DELETE]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível remover a imagem.' } }, { status: 500 });
  }
}

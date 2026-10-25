import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const schema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN']),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  let admin: boolean;
  try {
    admin = await isCurrentUserAdmin();
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível validar as permissões.' } }, { status: 500 });
  }
  if (!admin) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Apenas administradores podem moderar avaliações.' } }, { status: 403 });
  }

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Status de avaliação inválido.' } }, { status: 400 });
  }

  const { reviewId } = await context.params;
  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: body.data.status },
      select: { id: true, status: true },
    });
    return NextResponse.json({ review, message: 'Avaliação atualizada.' });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: { code: 'REVIEW_NOT_FOUND', message: 'Avaliação não encontrada.' } }, { status: 404 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível atualizar a avaliação.' } }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const { reviewId } = await context.params;
    await prisma.review.delete({ where: { id: reviewId } });
    return NextResponse.json({ message: 'Comentário/avaliação excluído.' });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: { message: 'Avaliação não encontrada.' } }, { status: 404 });
    return NextResponse.json({ error: { message: 'Não foi possível excluir a avaliação.' } }, { status: 500 });
  }
}

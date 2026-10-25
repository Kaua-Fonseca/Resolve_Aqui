import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ categoryId: string }> }) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const { categoryId } = await context.params;
    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ message: 'Categoria excluída.' });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: { message: 'Categoria não encontrada.' } }, { status: 404 });
    return NextResponse.json({ error: { message: 'Não foi possível excluir a categoria.' } }, { status: 500 });
  }
}

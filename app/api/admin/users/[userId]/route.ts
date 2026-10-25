import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/admin';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const auth = await getAuthUser();
    const { userId } = await context.params;
    if (auth?.sub === userId) return NextResponse.json({ error: { message: 'Você não pode excluir sua própria conta administrativa.' } }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) return NextResponse.json({ error: { message: 'Usuário não encontrado.' } }, { status: 404 });
    if (target.role === 'ADMIN') return NextResponse.json({ error: { message: 'Por segurança, outra conta ADMIN não pode ser excluída por esta tela.' } }, { status: 403 });
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: 'Usuário excluído com sucesso.' });
  } catch {
    return NextResponse.json({ error: { message: 'Não foi possível excluir o usuário.' } }, { status: 500 });
  }
}

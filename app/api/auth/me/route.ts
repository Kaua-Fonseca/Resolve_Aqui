import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'Conta não encontrada.' } }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível consultar a conta.' } }, { status: 500 });
  }
}

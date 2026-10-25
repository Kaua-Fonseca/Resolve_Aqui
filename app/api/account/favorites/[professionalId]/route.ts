import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PUT(_request: Request, context: { params: Promise<{ professionalId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  const { professionalId } = await context.params;
  const parsed = z.string().min(1).max(100).safeParse(professionalId);
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Profissional inválido.' } }, { status: 400 });
  try {
    const professional = await prisma.professionalProfile.findFirst({ where: { id: parsed.data, isPublished: true }, select: { id: true } });
    if (!professional) return NextResponse.json({ error: { code: 'PROFESSIONAL_NOT_FOUND', message: 'Profissional não encontrado.' } }, { status: 404 });
    await prisma.favorite.upsert({
      where: { userId_professionalId: { userId: auth.sub, professionalId: professional.id } },
      create: { userId: auth.sub, professionalId: professional.id }, update: {},
    });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível salvar o favorito.' } }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ professionalId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  const { professionalId } = await context.params;
  const parsed = z.string().min(1).max(100).safeParse(professionalId);
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Profissional inválido.' } }, { status: 400 });
  try {
    await prisma.favorite.deleteMany({ where: { userId: auth.sub, professionalId: parsed.data } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível remover o favorito.' } }, { status: 500 });
  }
}

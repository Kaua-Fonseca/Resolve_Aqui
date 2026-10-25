import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ professionalId: string }> }) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const { professionalId } = await context.params;
    const profile = await prisma.professionalProfile.findUnique({ where: { id: professionalId }, select: { id: true, userId: true } });
    if (!profile) return NextResponse.json({ error: { message: 'Perfil profissional não encontrado.' } }, { status: 404 });
    await prisma.$transaction([
      prisma.professionalProfile.delete({ where: { id: professionalId } }),
      prisma.user.update({ where: { id: profile.userId }, data: { role: 'CLIENT' } }),
    ]);
    return NextResponse.json({ message: 'Perfil profissional excluído. A conta foi mantida como cliente.' });
  } catch {
    return NextResponse.json({ error: { message: 'Não foi possível excluir o perfil profissional.' } }, { status: 500 });
  }
}

const patchSchema = z.object({ isPublished: z.boolean().optional(), isVerified: z.boolean().optional() })
  .refine((v) => v.isPublished !== undefined || v.isVerified !== undefined);

export async function PATCH(request: NextRequest, context: { params: Promise<{ professionalId: string }> }) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { message: 'Informe isPublished e/ou isVerified.' } }, { status: 400 });
    const { professionalId } = await context.params;
    const profile = await prisma.professionalProfile.update({ where: { id: professionalId }, data: parsed.data, select: { id: true, isPublished: true, isVerified: true } });
    return NextResponse.json({ profile, message: profile.isPublished ? 'Perfil publicado no site.' : 'Perfil ocultado do site.' });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: { message: 'Perfil profissional não encontrado.' } }, { status: 404 });
    return NextResponse.json({ error: { message: 'Não foi possível atualizar o perfil profissional.' } }, { status: 500 });
  }
}

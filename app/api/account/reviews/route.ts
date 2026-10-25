import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const schema = z.object({
  professionalId: z.string().min(1).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000),
});

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  if (auth.role !== 'CLIENT') return NextResponse.json({ error: { code: 'CLIENTS_ONLY', message: 'Somente contas de cliente podem enviar avaliações.' } }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Informe o profissional, uma nota de 1 a 5 e um comentário válido.' } }, { status: 400 });
  try {
    const professional = await prisma.professionalProfile.findFirst({ where: { id: parsed.data.professionalId, isPublished: true }, select: { id: true, userId: true } });
    if (!professional) return NextResponse.json({ error: { code: 'PROFESSIONAL_NOT_FOUND', message: 'Profissional não encontrado.' } }, { status: 404 });
    if (professional.userId === auth.sub) return NextResponse.json({ error: { code: 'SELF_REVIEW', message: 'Você não pode avaliar seu próprio perfil.' } }, { status: 400 });
    const review = await prisma.review.create({ data: {
      authorId: auth.sub, professionalId: professional.id, rating: parsed.data.rating,
      comment: parsed.data.comment, status: 'PENDING', serviceConfirmed: false,
    }, select: { id: true, rating: true, comment: true, status: true, createdAt: true } });
    return NextResponse.json({ review, message: 'Avaliação enviada para análise.' }, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: { code: 'REVIEW_EXISTS', message: 'Você já avaliou este profissional.' } }, { status: 409 });
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível enviar a avaliação.' } }, { status: 500 });
  }
}

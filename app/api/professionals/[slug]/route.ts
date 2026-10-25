import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const parsed = z.string().min(1).max(150).safeParse(slug);
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_SLUG', message: 'Perfil inválido.' } }, { status: 400 });

  try {
    const p = await prisma.professionalProfile.findFirst({
      where: { slug: parsed.data, isPublished: true },
      select: {
        id: true, slug: true, headline: true, description: true, city: true, state: true,
        neighborhoods: true, whatsapp: true, yearsExperience: true, isVerified: true,
        images: { orderBy: { createdAt: 'desc' }, select: { id: true, kind: true } },
        user: { select: { name: true } },
        categories: { select: { isPrimary: true, category: { select: { name: true, slug: true } } } },
        services: { where: { isActive: true }, select: { id: true, title: true, description: true, priceFrom: true } },
        reviews: {
          where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 50,
          select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { name: true } } },
        },
      },
    });
    if (!p) return NextResponse.json({ error: { code: 'PROFESSIONAL_NOT_FOUND', message: 'Profissional não encontrado.' } }, { status: 404 });
    const ratings = p.reviews.map((r) => r.rating);
    return NextResponse.json({ professional: {
      id: p.id, slug: p.slug, name: p.user.name, headline: p.headline, description: p.description,
      city: p.city, state: p.state, neighborhoods: p.neighborhoods, whatsapp: p.whatsapp,
      yearsExperience: p.yearsExperience, isVerified: p.isVerified,
      categories: p.categories.map((c) => ({ ...c.category, isPrimary: c.isPrimary })),
      services: p.services.map((s) => ({ ...s, priceFrom: s.priceFrom?.toString() ?? null })),
      averageRating: ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : null,
      reviewCount: ratings.length, reviews: p.reviews,
      avatarId: p.images.find((i: { kind: string }) => i.kind === 'AVATAR')?.id ?? null,
      workImages: p.images.filter((i: { kind: string }) => i.kind === 'WORK').map((i: { id: string }) => i.id),
    } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar o perfil.' } }, { status: 500 });
  }
}

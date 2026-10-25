import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).default('Foz do Iguaçu'),
  neighborhood: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Filtros de busca inválidos.' } }, { status: 400 });
  }

  const { q, category, city, neighborhood, page, limit } = parsed.data;
  const where = {
    isPublished: true,
    city: { equals: city, mode: 'insensitive' as const },
    ...(neighborhood ? { neighborhoods: { has: neighborhood } } : {}),
    ...(q ? { OR: [
      { headline: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { user: { name: { contains: q, mode: 'insensitive' as const } } },
      { categories: { some: { category: { name: { contains: q, mode: 'insensitive' as const } } } } },
    ] } : {}),
    ...(category ? { categories: { some: { category: { name: { equals: category, mode: 'insensitive' as const } } } } } : {}),
  };

  try {
    const [total, professionals] = await prisma.$transaction([
      prisma.professionalProfile.count({ where }),
      prisma.professionalProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, slug: true, headline: true, description: true, city: true, state: true,
          neighborhoods: true, whatsapp: true, yearsExperience: true, isVerified: true,
          user: { select: { name: true } },
          categories: { select: { isPrimary: true, category: { select: { name: true, slug: true } } } },
          reviews: { where: { status: 'PUBLISHED' }, select: { rating: true } },
          images: { where: { kind: 'AVATAR' }, orderBy: { createdAt: 'desc' }, take: 1, select: { id: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: professionals.map((p) => {
        const ratings = p.reviews.map((r) => r.rating);
        return {
          id: p.id, slug: p.slug, name: p.user.name, avatarId: p.images[0]?.id ?? null, headline: p.headline,
          description: p.description, city: p.city, state: p.state,
          neighborhoods: p.neighborhoods, whatsapp: p.whatsapp,
          yearsExperience: p.yearsExperience, isVerified: p.isVerified,
          categories: p.categories.map((c) => ({ ...c.category, isPrimary: c.isPrimary })),
          averageRating: ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : null,
          reviewCount: ratings.length,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível buscar profissionais.' } }, { status: 500 });
  }
}

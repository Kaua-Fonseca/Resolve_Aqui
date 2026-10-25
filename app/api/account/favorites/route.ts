import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: auth.sub }, orderBy: { createdAt: 'desc' },
      select: { createdAt: true, professional: {
        select: { id: true, slug: true, headline: true, city: true, state: true,
          user: { select: { name: true } },
          images: { where: { kind: 'AVATAR' }, orderBy: { createdAt: 'desc' }, take: 1, select: { id: true } },
          categories: { select: { isPrimary: true, category: { select: { name: true } } } },
        },
      } },
    });
    return NextResponse.json({ favorites: favorites.map((f) => ({
      savedAt: f.createdAt,
      professional: {
        id: f.professional.id, slug: f.professional.slug, headline: f.professional.headline,
        city: f.professional.city, state: f.professional.state, name: f.professional.user.name, avatarId: f.professional.images[0]?.id ?? null,
        categories: f.professional.categories.map((c) => ({ ...c.category, isPrimary: c.isPrimary })),
      },
    })) });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar favoritos.' } }, { status: 500 });
  }
}

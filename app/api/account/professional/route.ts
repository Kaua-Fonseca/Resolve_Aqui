import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const profileSelect = {
  id: true, slug: true, headline: true, description: true, city: true, state: true,
  neighborhoods: true, whatsapp: true, yearsExperience: true, isVerified: true, isPublished: true,
  user: { select: { name: true, email: true } },
  categories: { orderBy: { isPrimary: 'desc' as const }, select: { category: { select: { name: true } } } },
  images: { orderBy: { createdAt: 'desc' as const }, select: { id: true, kind: true } },
} as const;

const schema = z.object({
  headline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  neighborhoods: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  categories: z.array(z.string().trim().min(1).max(100)).min(1).max(20).optional(),
});

function serialize(p: {
  id: string; slug: string; headline: string | null; description: string | null; city: string; state: string;
  neighborhoods: string[]; whatsapp: string | null; yearsExperience: number | null; isVerified: boolean; isPublished: boolean;
  user: { name: string; email: string }; categories: { category: { name: string } }[]; images: { id: string; kind: 'AVATAR' | 'WORK' }[];
}) {
  return {
    id: p.id, slug: p.slug, name: p.user.name, email: p.user.email, headline: p.headline, description: p.description,
    city: p.city, state: p.state, neighborhoods: p.neighborhoods, whatsapp: p.whatsapp, yearsExperience: p.yearsExperience,
    isVerified: p.isVerified, isPublished: p.isPublished, categories: p.categories.map((c) => c.category.name),
    avatarId: p.images.find((i) => i.kind === 'AVATAR')?.id ?? null,
    workImages: p.images.filter((i) => i.kind === 'WORK').map((i) => i.id),
  };
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  try {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId: auth.sub }, select: profileSelect });
    if (!profile) return NextResponse.json({ error: { code: 'NOT_PROFESSIONAL', message: 'Esta conta não possui perfil profissional.' } }, { status: 404 });
    const [reviewList, pending] = await Promise.all([
      prisma.review.findMany({
        where: { professionalId: profile.id, status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 100,
        select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { name: true } } },
      }),
      prisma.review.count({ where: { professionalId: profile.id, status: 'PENDING' } }),
    ]);
    const average = reviewList.length ? Math.round((reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewList.length) * 10) / 10 : null;
    return NextResponse.json({ profile: serialize(profile), reviews: { published: reviewList.length, pending, average }, reviewList });
  } catch (error) {
    console.error('[account/professional GET]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar o perfil.' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Entre na sua conta.' } }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Confira os campos do perfil.' } }, { status: 400 });
  const data = parsed.data;
  try {
    const current = await prisma.professionalProfile.findUnique({ where: { userId: auth.sub }, select: { id: true } });
    if (!current) return NextResponse.json({ error: { code: 'NOT_PROFESSIONAL', message: 'Esta conta não possui perfil profissional.' } }, { status: 404 });

    let categoryIds: string[] | null = null;
    if (data.categories) {
      const found = await prisma.category.findMany({ where: { name: { in: data.categories } }, select: { id: true, name: true } });
      const byName = new Map<string, string>(found.map((c): [string, string] => [c.name, c.id]));
      const missing = data.categories.filter((name) => !byName.has(name));
      if (missing.length) return NextResponse.json({ error: { code: 'UNKNOWN_CATEGORY', message: `Categoria não encontrada: ${missing.join(', ')}.` } }, { status: 400 });
      categoryIds = data.categories.map((name) => byName.get(name)!);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (categoryIds) {
        await tx.professionalCategory.deleteMany({ where: { professionalId: current.id } });
        await tx.professionalCategory.createMany({ data: categoryIds.map((categoryId, index) => ({ professionalId: current.id, categoryId, isPrimary: index === 0 })) });
      }
      return tx.professionalProfile.update({
        where: { id: current.id },
        data: {
          ...(data.headline !== undefined ? { headline: data.headline || null } : {}),
          ...(data.description !== undefined ? { description: data.description || null } : {}),
          ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp.replace(/\D/g, '') || null } : {}),
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(data.neighborhoods !== undefined ? { neighborhoods: data.neighborhoods } : {}),
          ...(data.yearsExperience !== undefined ? { yearsExperience: data.yearsExperience } : {}),
        },
        select: profileSelect,
      });
    });
    return NextResponse.json({ profile: serialize(updated), message: 'Perfil atualizado.' });
  } catch (error) {
    console.error('[account/professional PATCH]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível salvar o perfil.' } }, { status: 500 });
  }
}

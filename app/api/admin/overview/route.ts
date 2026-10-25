import { NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const [users, professionals, reviews, categories, settings, userCount, professionalCount, reviewCount, pendingCount] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }),
      prisma.professionalProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, slug: true, city: true, isPublished: true, isVerified: true, createdAt: true, user: { select: { id: true, name: true, email: true } }, categories: { include: { category: { select: { name: true } } } } } }),
      prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, rating: true, comment: true, status: true, createdAt: true, author: { select: { name: true, email: true } }, professional: { select: { id: true, user: { select: { name: true } } } } } }),
      prisma.category.findMany({ orderBy: [{ groupName: 'asc' }, { name: 'asc' }], select: { id: true, name: true, slug: true, groupName: true, _count: { select: { professionals: true, services: true } } } }),
      prisma.systemSetting.findMany({ where: { key: { in: ['siteName', 'supportEmail', 'defaultCity', 'siteDescription'] } } }),
      prisma.user.count(), prisma.professionalProfile.count(), prisma.review.count(), prisma.review.count({ where: { status: 'PENDING' } }),
    ]);
    const values: Record<string, string> = { siteName: 'Resolve Aqui', supportEmail: 'contato@resolveaqui.com.br', defaultCity: 'Foz do Iguaçu, PR', siteDescription: 'Encontre profissionais locais e entre em contato diretamente.' };
    for (const setting of settings) values[setting.key] = setting.value;
    return NextResponse.json({ users, professionals, reviews, categories, settings: values, stats: { userCount, professionalCount, reviewCount, pendingCount } });
  } catch {
    return NextResponse.json({ error: { message: 'Não foi possível carregar os dados administrativos.' } }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAuthConfigured, errorResponse, setAuthCookie, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z.string().min(8).max(72),
  role: z.enum(['CLIENT', 'PROFESSIONAL']).default('CLIENT'),
  categories: z.array(z.string().trim().min(1).max(100)).max(20).optional().default([]),
  city: z.string().trim().min(2).max(100).optional().default('Foz do Iguaçu'),
  description: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Confira os campos. A senha deve ter ao menos 8 caracteres.' } }, { status: 400 });
  try {
    assertAuthConfigured();
    const data = parsed.data;
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: {
        name: data.name, email: data.email, phone: data.phone || null, passwordHash, role: data.role,
      } });
      if (data.role === 'PROFESSIONAL') {
        const baseSlug = data.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profissional';
        const categories = [];
        for (const [index, name] of data.categories.entries()) {
          const categorySlug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `categoria-${index}`;
          const category = await tx.category.upsert({
            where: { name },
            create: { name, slug: categorySlug, groupName: 'Outros serviços' },
            update: {},
          });
          categories.push({ categoryId: category.id, isPrimary: index === 0 });
        }
        await tx.professionalProfile.create({ data: {
          userId: created.id, slug: `${baseSlug}-${created.id.slice(-6)}`,
          city: data.city, description: data.description || null, isPublished: false,
          categories: categories.length ? { create: categories } : undefined,
        } });
      }
      return created;
    });
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, message: 'Conta criada com sucesso.' }, { status: 201 });
    setAuthCookie(response, signToken({ sub: user.id, role: user.role }));
    return response;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return errorResponse(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado.');
    console.error('[register] falha ao criar conta:', error);
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Não foi possível criar a conta. Verifique o terminal do servidor.');
  }
}

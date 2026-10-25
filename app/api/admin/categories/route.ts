import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  groupName: z.string().trim().min(2).max(100),
});

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'categoria';
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { message: 'Informe o nome e o grupo da categoria.' } }, { status: 400 });
    const base = slugify(parsed.data.name);
    let slug = base;
    let suffix = 1;
    while (await prisma.category.findUnique({ where: { slug } })) slug = base + '-' + suffix++;
    const category = await prisma.category.create({ data: { ...parsed.data, slug } });
    return NextResponse.json({ category, message: 'Categoria criada.' }, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: { message: 'Já existe uma categoria com esse nome.' } }, { status: 409 });
    return NextResponse.json({ error: { message: 'Não foi possível criar a categoria.' } }, { status: 500 });
  }
}

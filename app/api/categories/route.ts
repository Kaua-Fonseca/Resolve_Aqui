import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ groupName: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, groupName: true },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar as categorias.' } }, { status: 500 });
  }
}

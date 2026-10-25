import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cidades que realmente têm profissionais publicados (usadas nas sugestões do seletor de cidade).
export async function GET() {
  try {
    const rows = await prisma.professionalProfile.groupBy({ by: ['city', 'state'], where: { isPublished: true }, _count: { _all: true } });
    const merged = new Map<string, { name: string; state: string; count: number }>();
    for (const row of rows) {
      const key = row.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      const current = merged.get(key);
      if (current) current.count += row._count._all;
      else merged.set(key, { name: row.city.trim(), state: row.state, count: row._count._all });
    }
    const cities = Array.from(merged.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
    return NextResponse.json({ cities });
  } catch (error) {
    console.error('[cities GET]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar as cidades.' } }, { status: 500 });
  }
}

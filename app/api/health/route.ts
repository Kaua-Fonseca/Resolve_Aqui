import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Abra /api/health para saber se o banco está conectado e com as tabelas criadas.
export async function GET() {
  const jwtOk = (process.env.JWT_SECRET?.length ?? 0) >= 32;
  try {
    const [users, categories] = await Promise.all([prisma.user.count(), prisma.category.count()]);
    return NextResponse.json({ status: 'ok', service: 'resolve-aqui', database: 'connected', jwtSecretConfigured: jwtOk, users, categories, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[health] banco indisponível:', error);
    return NextResponse.json({ status: 'error', service: 'resolve-aqui', database: 'unavailable', jwtSecretConfigured: jwtOk, hint: 'Confira DATABASE_URL no .env e rode: npm run prisma:migrate', timestamp: new Date().toISOString() }, { status: 503 });
  }
}

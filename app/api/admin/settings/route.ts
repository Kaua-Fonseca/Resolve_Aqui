import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const keys = ['siteName', 'supportEmail', 'defaultCity', 'siteDescription'] as const;
const schema = z.object({
  siteName: z.string().trim().min(2).max(100),
  supportEmail: z.string().trim().email().max(254),
  defaultCity: z.string().trim().min(2).max(100),
  siteDescription: z.string().trim().min(2).max(300),
});

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const rows = await prisma.systemSetting.findMany({ where: { key: { in: [...keys] } } });
    const settings: Record<string, string> = {
      siteName: 'Resolve Aqui',
      supportEmail: 'contato@resolveaqui.com.br',
      defaultCity: 'Foz do Iguaçu, PR',
      siteDescription: 'Encontre profissionais locais e entre em contato diretamente.',
    };
    for (const row of rows) settings[row.key] = row.value;
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: { message: 'Não foi possível carregar as configurações.' } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: { message: 'Acesso restrito a administradores.' } }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { message: 'Confira os campos das configurações.' } }, { status: 400 });
    await prisma.$transaction(Object.entries(parsed.data).map(([key, value]) => prisma.systemSetting.upsert({
      where: { key }, create: { key, value }, update: { value },
    })));
    return NextResponse.json({ message: 'Configurações salvas.' });
  } catch {
    return NextResponse.json({ error: { message: 'Não foi possível salvar as configurações.' } }, { status: 500 });
  }
}

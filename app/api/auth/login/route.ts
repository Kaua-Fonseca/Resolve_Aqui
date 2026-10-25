import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errorResponse, setAuthCookie, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, 'VALIDATION_ERROR', 'Informe um e-mail válido e uma senha.');
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, message: 'Login realizado com sucesso.' });
    setAuthCookie(response, signToken({ sub: user.id, role: user.role }));
    return response;
  } catch (error) {
    console.error('[login] falha:', error);
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Não foi possível realizar o login. Verifique o terminal do servidor.');
  }
}

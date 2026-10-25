import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const payloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN']),
});

export type UserRole = z.infer<typeof payloadSchema>['role'];
export type AuthUser = z.infer<typeof payloadSchema>;

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export function assertAuthConfigured() {
  secret();
}

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.');
  return value;
}

export function signToken(user: AuthUser) {
  return jwt.sign({ role: user.role }, secret(), {
    subject: user.sub,
    expiresIn: SESSION_SECONDS,
    issuer: 'resolve-aqui',
    audience: 'resolve-aqui-web',
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, secret(), {
      issuer: 'resolve-aqui',
      audience: 'resolve-aqui-web',
    });
    const parsed = payloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get('ra_access')?.value;
  return token ? verifyToken(token) : null;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set('ra_access', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set('ra_access', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

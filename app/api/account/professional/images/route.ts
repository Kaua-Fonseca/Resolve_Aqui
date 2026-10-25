import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { MAX_IMAGE_BYTES, MAX_WORK_PHOTOS, sniffImageType } from '@/lib/images';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status });

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Entre na sua conta.');
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const kind = form?.get('kind');
  if (!(file instanceof File) || (kind !== 'AVATAR' && kind !== 'WORK')) return fail(400, 'VALIDATION_ERROR', 'Envie uma imagem e o tipo (AVATAR ou WORK).');
  if (file.size > MAX_IMAGE_BYTES) return fail(413, 'FILE_TOO_LARGE', 'A imagem deve ter no máximo 3 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffImageType(bytes);
  if (!mimeType) return fail(415, 'UNSUPPORTED_TYPE', 'Use uma imagem JPG, PNG ou WebP.');
  try {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId: auth.sub }, select: { id: true } });
    if (!profile) return fail(404, 'NOT_PROFESSIONAL', 'Esta conta não possui perfil profissional.');
    if (kind === 'WORK') {
      const total = await prisma.professionalImage.count({ where: { professionalId: profile.id, kind: 'WORK' } });
      if (total >= MAX_WORK_PHOTOS) return fail(400, 'LIMIT_REACHED', `Você pode ter até ${MAX_WORK_PHOTOS} fotos de trabalhos.`);
    }
    const image = await prisma.$transaction(async (tx) => {
      if (kind === 'AVATAR') await tx.professionalImage.deleteMany({ where: { professionalId: profile.id, kind: 'AVATAR' } });
      return tx.professionalImage.create({ data: { professionalId: profile.id, kind, mimeType, data: bytes }, select: { id: true, kind: true } });
    });
    return NextResponse.json({ image, message: kind === 'AVATAR' ? 'Foto de perfil atualizada.' : 'Foto adicionada.' }, { status: 201 });
  } catch (error) {
    console.error('[professional images POST]', error);
    return fail(500, 'INTERNAL_SERVER_ERROR', 'Não foi possível salvar a imagem.');
  }
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error('Defina ADMIN_EMAIL com o e-mail de uma conta já cadastrada antes de executar este script.');
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
  if (!user) {
    throw new Error('Conta não encontrada. Cadastre-se normalmente no Resolve Aqui e depois execute novamente.');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
    select: { email: true, role: true },
  });

  console.log(`Papel atualizado: ${updated.email} -> ${updated.role}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falha ao promover administrador.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

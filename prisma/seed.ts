import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const groups = [
  { groupName: 'Reparos e manutenção residencial', items: ['Eletricista', 'Encanador', 'Pintor', 'Pedreiro', 'Marceneiro', 'Montador de móveis', 'Serralheiro', 'Telhadista', 'Instalador de ar-condicionado', 'Chaveiro', 'Carpinteiro'] },
  { groupName: 'Limpeza e serviços domésticos', items: ['Diarista', 'Faxineiro', 'Limpeza pós-obra', 'Jardinagem', 'Paisagismo'] },
  { groupName: 'Tecnologia e informática', items: ['Técnico de informática', 'Manutenção de notebooks e computadores', 'Técnico de redes', 'Instalação de câmeras de segurança', 'Instalação de alarmes', 'Automação residencial'] },
  { groupName: 'Automotivo', items: ['Mecânico', 'Eletricista automotivo', 'Funilaria e pintura', 'Lavagem automotiva', 'Instalação de acessórios automotivos'] },
  { groupName: 'Beleza e cuidados pessoais', items: ['Cabeleireiro', 'Barbeiro', 'Manicure e pedicure', 'Maquiador'] },
  { groupName: 'Eventos e outros serviços', items: ['Fotógrafo', 'Decorador de eventos', 'Buffet', 'Professor particular', 'Costureiro', 'Outro serviço'] },
];

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  for (const group of groups) {
    for (const name of group.items) {
      await prisma.category.upsert({
        where: { name },
        create: { name, slug: slugify(name), groupName: group.groupName },
        update: { groupName: group.groupName },
      });
    }
  }
  console.log('Categorias do Resolve Aqui cadastradas.');

  // Opcional: defina ADMIN_EMAIL e ADMIN_PASSWORD (min. 8 caracteres) no .env para criar/promover o administrador.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 8) throw new Error('ADMIN_PASSWORD deve ter ao menos 8 caracteres.');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      create: { name: process.env.ADMIN_NAME?.trim() || 'Administrador', email: adminEmail, passwordHash, role: 'ADMIN' },
      update: { role: 'ADMIN', isActive: true, passwordHash },
    });
    console.log(`Administrador pronto: ${admin.email}`);
  }
}

main().finally(async () => prisma.$disconnect());

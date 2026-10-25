import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { AdminManagement } from './management';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const auth = await getAuthUser();
  if (!auth) redirect('/');

  const admin = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!admin || !admin.isActive || admin.role !== 'ADMIN') redirect('/');

  return <AdminManagement adminName={admin.name} />;
}

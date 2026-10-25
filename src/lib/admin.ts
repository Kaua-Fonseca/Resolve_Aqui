import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function isCurrentUserAdmin() {
  const auth = await getAuthUser();
  if (!auth) return false;

  // Re-check the current database role instead of trusting the JWT role alone.
  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { role: true, isActive: true },
  });

  return user?.isActive === true && user.role === 'ADMIN';
}

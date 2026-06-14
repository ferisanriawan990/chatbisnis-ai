import { prisma } from './prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Validates that the specified user has access to the specified business profile.
 * In a real multi-tenant app, this checks if the user is the owner OR has a role assignment.
 */
export async function assertTenantAccess(userId: string, businessProfileId: string): Promise<boolean> {
  // Check if owner
  const isOwner = await prisma.businessProfile.findFirst({
    where: { id: businessProfileId, userId }
  });

  if (isOwner) return true;

  // Check if assigned via Role
  const roleAssignment = await prisma.userRoleAssignment.findFirst({
    where: { userId, businessProfileId }
  });

  if (roleAssignment) return true;

  // Otherwise check if Super Admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === 'ADMIN') return true;

  return false;
}

/**
 * Reusable tenant wrapper for prisma queries to ensure `businessProfileId` is always injected.
 * Usage:
 * const customers = await prisma.customer.findMany(withTenant(businessProfileId, { where: { ... } }))
 */
export function withTenant<T extends { where?: any }>(businessProfileId: string, query: T): T {
  return {
    ...query,
    where: {
      ...query.where,
      businessProfileId
    }
  };
}

/**
 * Retrieves the active tenant context for the current request.
 * It checks explicit headers/query params, falling back to the first available tenant in the session.
 */
export async function getActiveTenant(req?: Request, sessionUser?: any): Promise<{ id: string, role: string } | null> {
  const user = sessionUser || (await getServerSession(authOptions))?.user as any;
  if (!user) return null;

  // 1. Check explicit header or query param
  let requestedTenantId = null;
  if (req) {
     const url = new URL(req.url);
     requestedTenantId = url.searchParams.get('tenantId') || req.headers?.get('x-tenant-id');
  }

  if (requestedTenantId && user.tenants) {
     const tenant = user.tenants.find((t: any) => t.id === requestedTenantId);
     if (tenant) return { id: tenant.id, role: tenant.role };
  }

  // 2. Fallback to first available tenant in session
  if (user.tenants && user.tenants.length > 0) {
    return { id: user.tenants[0].id, role: user.tenants[0].role };
  }

  // 3. Absolute Fallback (if session is stale or tokens are missing)
  const ownedProfile = await prisma.businessProfile.findFirst({ where: { userId: user.id } });
  if (ownedProfile) return { id: ownedProfile.id, role: 'owner' };

  const assigned = await prisma.userRoleAssignment.findFirst({ where: { userId: user.id }, include: { role: true } });
  if (assigned && assigned.businessProfileId) return { id: assigned.businessProfileId, role: assigned.role.name };

  return null;
}

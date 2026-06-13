import { prisma } from './prisma';

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

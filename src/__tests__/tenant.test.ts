import { describe, it, expect, vi } from 'vitest';
import { assertTenantAccess } from '@/lib/tenant-isolation';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    businessProfile: { findFirst: vi.fn() },
    userRoleAssignment: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() }
  }
}));

describe('Tenant Isolation Service', () => {
  it('should return true if user is owner', async () => {
    vi.mocked(prisma.businessProfile.findFirst).mockResolvedValueOnce({ id: 'bp-1', userId: 'user-1' } as any);
    const result = await assertTenantAccess('user-1', 'bp-1');
    expect(result).toBe(true);
  });

  it('should return false if user does not belong to tenant', async () => {
    vi.mocked(prisma.businessProfile.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.userRoleAssignment.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ role: 'USER' } as any);
    
    const result = await assertTenantAccess('user-1', 'bp-2');
    expect(result).toBe(false);
  });
});

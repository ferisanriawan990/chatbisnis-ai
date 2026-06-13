import { prisma } from './prisma';

export async function isFeatureEnabled(businessProfileId: string, featureKey: string): Promise<boolean> {
  const setting = await prisma.tenantFeatureSetting.findFirst({
    where: {
      businessProfileId,
      feature: { key: featureKey }
    },
    include: { feature: true }
  });

  if (!setting) {
    // Check if the feature itself is active globally
    const globalFeature = await prisma.featureDefinition.findUnique({
      where: { key: featureKey }
    });
    return globalFeature?.isActive ?? false;
  }

  return setting.isEnabled && setting.feature.isActive;
}

export async function getFeatureLimit(businessProfileId: string, featureKey: string): Promise<number | null> {
  const setting = await prisma.tenantFeatureSetting.findFirst({
    where: {
      businessProfileId,
      feature: { key: featureKey }
    }
  });

  return setting?.limitCount ?? null;
}

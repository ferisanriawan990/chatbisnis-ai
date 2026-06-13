import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.businessProfile.findFirst();
  if (!profile) {
    console.log('No business profile found. Exiting.');
    return;
  }

  const existing = await prisma.voucher.findFirst({
    where: { code: 'DISKON10', businessProfileId: profile.id }
  });

  if (!existing) {
    const voucher = await prisma.voucher.create({
      data: {
        businessProfileId: profile.id,
        code: 'DISKON10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        isActive: true
      }
    });
    console.log('Successfully created demo voucher:', voucher.code);
  } else {
    console.log('Demo voucher DISKON10 already exists.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

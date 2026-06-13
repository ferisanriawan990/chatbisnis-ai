import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
    if (freePlan) {
      await prisma.plan.delete({ where: { slug: 'free' } });
      console.log('✅ Free plan deleted successfully.');
    } else {
      console.log('Free plan already deleted or not found.');
    }
  } catch (error) {
    console.error('Error deleting free plan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

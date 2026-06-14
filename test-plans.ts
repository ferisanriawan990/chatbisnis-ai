import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.plan.findMany();
  console.log('All plans:', plans);
  await prisma.$disconnect();
}

checkPlans();

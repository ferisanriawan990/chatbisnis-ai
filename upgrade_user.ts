import { prisma } from './src/lib/prisma.js';

async function upgrade() {
  const user = await prisma.user.findUnique({ where: { email: 'ferisanriawan@gmail.com' } });
  if (!user) return console.log('User not found');

  const businessPlan = await prisma.plan.findUnique({ where: { slug: 'business' } });
  if (!businessPlan) return console.log('Business plan not found');

  // Update their subscription to business plan
  await prisma.subscription.updateMany({
    where: { userId: user.id, status: 'active' },
    data: { planId: businessPlan.id }
  });

  console.log('User upgraded to Business Plan');
}
upgrade().catch(console.error).finally(() => process.exit(0));

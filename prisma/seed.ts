import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Default Plans
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      priceMonthly: 0,
      maxWhatsappSessions: 1,
      maxKnowledgeItems: 20,
      dailyChatLimit: 30,
      monthlyChatLimit: 300,
      allowN8nTemplates: false,
      allowLeadCapture: false,
      allowHumanHandover: false,
      allowCustomApiKey: false,
    },
    {
      name: 'Starter',
      slug: 'starter',
      priceMonthly: 49000,
      maxWhatsappSessions: 1,
      maxKnowledgeItems: 100,
      dailyChatLimit: 200,
      monthlyChatLimit: 3000,
      allowN8nTemplates: true,
      allowLeadCapture: true,
      allowHumanHandover: true,
      allowCustomApiKey: false,
    },
    {
      name: 'Pro',
      slug: 'pro',
      priceMonthly: 149000,
      maxWhatsappSessions: 3,
      maxKnowledgeItems: 500,
      dailyChatLimit: 1000,
      monthlyChatLimit: 15000,
      allowN8nTemplates: true,
      allowLeadCapture: true,
      allowHumanHandover: true,
      allowCustomApiKey: true,
    },
    {
      name: 'Business',
      slug: 'business',
      priceMonthly: 399000,
      maxWhatsappSessions: 10,
      maxKnowledgeItems: 2000,
      dailyChatLimit: 5000,
      monthlyChatLimit: 100000,
      allowN8nTemplates: true,
      allowLeadCapture: true,
      allowHumanHandover: true,
      allowCustomApiKey: true,
    }
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });
    console.log(`Upserted Plan: ${planData.name}`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

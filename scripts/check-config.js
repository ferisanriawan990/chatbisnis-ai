const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.businessBotConfig.findUnique({
    where: { userId: "b661578a-7fcf-48df-be91-5b306e7a6409" },
    include: { template: true }
  });
  console.log(JSON.stringify(config, null, 2));
}

main().finally(() => prisma.$disconnect());

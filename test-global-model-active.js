const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const g = await prisma.secretCredential.findUnique({where: {key: 'GLOBAL_AI_MODEL'}});
  console.log("isActive:", g.isActive);
}
main().finally(()=>prisma.$disconnect());

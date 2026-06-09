const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const g = await prisma.secretCredential.findUnique({where: {key: 'FLAZ_API_KEY_GLOBAL'}});
  console.log("isActive:", g.isActive);
}
main().finally(()=>prisma.$disconnect());

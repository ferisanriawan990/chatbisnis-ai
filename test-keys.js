const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const keys = await prisma.secretCredential.findMany();
  console.log(keys.map(k => ({ key: k.key, name: k.name })));
}
main().finally(()=>prisma.$disconnect());

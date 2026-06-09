const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.wahaServer.findMany();
  console.log(c);
}
main().finally(()=>prisma.$disconnect());

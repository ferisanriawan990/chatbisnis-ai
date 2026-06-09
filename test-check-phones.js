const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.businessProfile.findMany();
  console.log(p.map(x => x.adminPhone));
}
main().finally(()=>prisma.$disconnect());

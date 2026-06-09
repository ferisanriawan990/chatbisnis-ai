const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.n8nTemplate.findFirst();
  console.log(t.workflowData);
}
main().finally(()=>prisma.$disconnect());

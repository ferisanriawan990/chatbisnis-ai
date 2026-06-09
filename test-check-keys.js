const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const servers = await prisma.wahaServer.findMany();
  console.log(servers.map(s => ({ port: s.baseUrl, key: s.apiKeyEncrypted })));
}
main().finally(()=>prisma.$disconnect());

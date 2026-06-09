const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const bots = await prisma.chatbotSetting.findMany({
    select: { id: true, wahaServerId: true, wahaSessionName: true, botName: true, userId: true }
  });
  console.log('Bots with session names:');
  console.log(JSON.stringify(bots.filter(b => b.wahaSessionName), null, 2));
}
main().finally(()=>prisma.$disconnect());

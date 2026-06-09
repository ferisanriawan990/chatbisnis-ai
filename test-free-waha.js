const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.whatsAppSession.deleteMany({
    where: { sessionName: 'default' }
  });
  await prisma.chatbotSetting.updateMany({
    where: { wahaSessionName: 'default' },
    data: { wahaServerId: null, wahaSessionName: 'waha_plus_required_freed' }
  });
  await prisma.wahaServer.updateMany({
    data: { currentSessions: 0 }
  });
  console.log("Freed the default session!");
}
main().finally(()=>prisma.$disconnect());

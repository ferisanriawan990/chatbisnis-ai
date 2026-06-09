const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    include: {
      chatbotSettings: {
        include: { wahaServer: true, whatsappSessions: true }
      }
    }
  });
  for (const u of users) {
    console.log(`User: ${u.email} (Created: ${u.createdAt})`);
    for (const c of u.chatbotSettings) {
      console.log(` - Server: ${c.wahaServer ? c.wahaServer.baseUrl : 'NULL'}`);
      for (const s of c.whatsappSessions) {
        console.log(`   - Session DB Status: ${s.status}`);
      }
    }
  }
}
main().finally(()=>prisma.$disconnect());

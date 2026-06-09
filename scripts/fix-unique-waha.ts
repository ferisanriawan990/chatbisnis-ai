import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting WAHA Session Unique Repair Script...');

  // 1. Delete all WhatsAppSessions that are not 'default'
  const deletedWPSessions = await prisma.whatsAppSession.deleteMany({
    where: {
      sessionName: {
        not: 'default'
      }
    }
  });
  console.log(`Deleted ${deletedWPSessions.count} orphaned/old WhatsAppSessions.`);

  // 2. Find all chatbots that have 'default'
  const defaults = await prisma.chatbotSetting.findMany({
    where: { wahaSessionName: 'default' },
    orderBy: { updatedAt: 'desc' }
  });

  if (defaults.length > 1) {
    console.log(`Found ${defaults.length} chatbots with 'default' session! Only keeping the most recently updated one.`);
    // Keep the first one, rewrite the rest
    for (let i = 1; i < defaults.length; i++) {
      const bot = defaults[i];
      await prisma.chatbotSetting.update({
        where: { id: bot.id },
        data: {
          wahaSessionName: `old_session_${bot.id.substring(0, 8)}`,
          wahaServerId: null,
          isActive: false
        }
      });
      console.log(`  - Deactivated and renamed bot ${bot.id} for user ${bot.userId}`);
    }
  } else {
    console.log('No unique constraint violations found for "default" session.');
  }

  console.log('Repair complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

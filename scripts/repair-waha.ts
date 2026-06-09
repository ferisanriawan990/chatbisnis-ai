import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting WAHA Session Repair Script...');

  // Find all chatbot settings with old dynamic sessions
  const chatbots = await prisma.chatbotSetting.findMany({
    where: {
      wahaSessionName: {
        not: 'default'
      }
    }
  });

  console.log(`Found ${chatbots.length} chatbots with dynamic session names.`);

  for (const bot of chatbots) {
    console.log(`Checking bot for user ${bot.userId} (Session: ${bot.wahaSessionName})`);

    // Check if 'default' is already taken
    const existingDefault = await prisma.chatbotSetting.findFirst({
      where: { wahaSessionName: 'default' }
    });

    if (existingDefault && existingDefault.id !== bot.id) {
      console.log(`  - Skipping: "default" session is already taken by user ${existingDefault.userId}.`);
      continue;
    }

    // Safely update to 'default'
    await prisma.chatbotSetting.update({
      where: { id: bot.id },
      data: { wahaSessionName: 'default' }
    });

    console.log(`  - Updated bot ${bot.id} to use session "default".`);

    // Remove old whatsapp sessions matching this old name
    const deleted = await prisma.whatsAppSession.deleteMany({
      where: { sessionName: bot.wahaSessionName }
    });
    console.log(`  - Deleted ${deleted.count} old WhatsApp sessions for ${bot.wahaSessionName}.`);
  }

  // Delete ANY remaining orphan sessions
  const deletedOrphans = await prisma.whatsAppSession.deleteMany({
    where: {
      sessionName: {
        not: 'default'
      }
    }
  });
  console.log(`Deleted ${deletedOrphans.count} orphaned dynamic WhatsApp sessions.`);

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

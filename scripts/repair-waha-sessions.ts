import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai perbaikan WhatsApp sessions aman...');
  let fixedCount = 0;
  let disabledCount = 0;
  let sessionUpdateCount = 0;

  const allSettings = await prisma.chatbotSetting.findMany({
    include: {
      businessProfile: true,
      whatsappServer: true,
    }
  });

  for (const setting of allSettings) {
    const isProduction = process.env.NODE_ENV === 'production';
    const bizId = setting.businessProfileId;
    const expectedSessionName = `biz-${bizId}`;
    
    // 1. Nonaktifkan jika tidak punya whatsappServerId di production
    if (isProduction && setting.isActive && !setting.whatsappServerId) {
      console.log(`Menonaktifkan ChatbotSetting ID ${setting.id} karena tidak memiliki whatsappServerId di production.`);
      await prisma.chatbotSetting.update({
        where: { id: setting.id },
        data: { isActive: false }
      });
      disabledCount++;
    }

    // 2. Perbaiki whatsappSessionName yang kosong/default/duplikat menjadi biz-{businessProfileId}
    if (!setting.whatsappSessionName || setting.whatsappSessionName === 'default' || setting.whatsappSessionName !== expectedSessionName) {
      console.log(`Memperbaiki sessionName untuk ChatbotSetting ID ${setting.id} -> ${expectedSessionName}`);
      
      await prisma.chatbotSetting.update({
        where: { id: setting.id },
        data: { whatsappSessionName: expectedSessionName }
      });
      fixedCount++;

      // 3. Update WhatsAppSession lama yang mungkin menggunakan sessionName lama
      if (setting.whatsappSessionName) {
        const oldSessions = await prisma.whatsAppSession.findMany({
          where: {
            userId: setting.userId,
            chatbotSettingId: setting.id,
          }
        });

        for (const os of oldSessions) {
          if (os.sessionName !== expectedSessionName) {
            await prisma.whatsAppSession.update({
              where: { id: os.id },
              data: { sessionName: expectedSessionName }
            });
            sessionUpdateCount++;
          }
        }
      }
    }
  }

  console.log('--- Laporan Perbaikan WhatsApp Sessions ---');
  console.log(`- ChatbotSetting dinonaktifkan (karena whatsappServerId kosong): ${disabledCount}`);
  console.log(`- ChatbotSetting whatsappSessionName diperbaiki: ${fixedCount}`);
  console.log(`- WhatsAppSession sessionName disinkronkan: ${sessionUpdateCount}`);
  console.log('Selesai.');
}

main()
  .catch((e) => {
    console.error('Error saat menjalankan script:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

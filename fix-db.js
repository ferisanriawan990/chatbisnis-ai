const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.chatbotSetting.updateMany({
    data: {
      wahaSessionName: 'default'
    }
  });
  console.log("Semua sesi WAHA di database berhasil diubah menjadi 'default'");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

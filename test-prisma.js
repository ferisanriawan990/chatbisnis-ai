const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const cb = await prisma.chatbotSetting.findFirst();
    if (!cb) {
      console.log("No chatbot setting found.");
      return;
    }
    console.log("Before update:", cb.useEmoji, cb.allowSelling, cb.allowVision);
    
    // Toggle them
    const updated = await prisma.chatbotSetting.update({
      where: { id: cb.id },
      data: {
        useEmoji: !cb.useEmoji,
        allowSelling: !cb.allowSelling,
        allowVision: !cb.allowVision
      }
    });
    
    console.log("After update:", updated.useEmoji, updated.allowSelling, updated.allowVision);
    
    // Restore
    await prisma.chatbotSetting.update({
      where: { id: cb.id },
      data: {
        useEmoji: cb.useEmoji,
        allowSelling: cb.allowSelling,
        allowVision: cb.allowVision
      }
    });
    console.log("Restored to original.");
  } catch(e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.businessProfile.findFirst();
  if (!profile) {
    console.log("No profile found");
    return;
  }

  try {
    const newMenu = await prisma.interactiveMenu.create({
      data: {
        businessProfileId: profile.id,
        keyword: 'test_keyword_' + Date.now(),
        title: 'Test Title',
        description: 'Test Desc',
        footer: 'Test Footer',
        isActive: true,
        buttons: {
          create: [
            {
              buttonText: 'Btn 1',
              actionType: 'reply',
              actionData: 'Reply 1',
              order: 0,
            }
          ]
        }
      },
      include: {
        buttons: true
      }
    });
    console.log("Created successfully:", newMenu);
  } catch (error) {
    console.error("Prisma error:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

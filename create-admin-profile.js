const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@chatbisnis.id" }
  });
  
  if (!user) {
    console.error("User not found!");
    return;
  }
  
  // Create Business Profile for them too
  const profile = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      name: "Default Tenant",
      businessName: "ChatBisnis AI",
      businessIndustry: "Technology",
      status: "active"
    }
  });
  
  console.log(`Created business profile: ${profile.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

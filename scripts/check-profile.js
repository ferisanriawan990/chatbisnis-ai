const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: "0b2877ae-6c4e-49f1-939a-c28d13c7d390" }
  });
  console.log(JSON.stringify(profile, null, 2));
}

main().finally(() => prisma.$disconnect());

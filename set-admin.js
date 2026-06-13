const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany();
  console.log("All users in DB:", allUsers);

  if (allUsers.length > 0) {
    const res = await prisma.user.updateMany({
      data: { role: 'ADMIN' },
    });
    console.log(`Updated ${res.count} users to ADMIN role.`);
  } else {
    console.log("No users found to update.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

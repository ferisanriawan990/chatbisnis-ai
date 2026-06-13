const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // NextAuth usually uses bcryptjs or bcrypt
const prisma = new PrismaClient();

async function main() {
  const email = "admin@chatbisnis.id";
  const password = "12345678";
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name: "Super Admin",
      passwordHash,
      role: "ADMIN"
    }
  });
  
  console.log(`Successfully created ADMIN user: ${user.email}`);
  
  // Create Business Profile for them too
  const profile = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      name: "Default Tenant",
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

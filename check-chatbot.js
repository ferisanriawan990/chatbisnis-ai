const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({id: u.id, name: u.name, email: u.email})));

  const chatbots = await prisma.chatbotSetting.findMany();
  console.log('Chatbots:', chatbots.map(c => ({id: c.id, userId: c.userId})));

  const profiles = await prisma.businessProfile.findMany();
  console.log('Profiles:', profiles.map(p => ({id: p.id, userId: p.userId})));
}

main().finally(() => prisma.$disconnect());

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
  const chatbots = await prisma.chatbotSetting.findMany();
  console.log('Chatbots:', chatbots);
  const profiles = await prisma.businessProfile.findMany();
  console.log('Profiles:', profiles);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

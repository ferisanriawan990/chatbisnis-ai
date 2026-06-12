import { prisma } from './src/lib/prisma.js';

async function check() {
  const secrets = await prisma.secretCredential.findMany();
  console.log('All secrets:', secrets.map(s => s.key));
}
check().catch(console.error).finally(() => process.exit(0));

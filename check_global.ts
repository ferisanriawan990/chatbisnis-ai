import { prisma } from './src/lib/prisma.js';

async function check() {
  const globalKey = await prisma.systemSetting.findUnique({ where: { key: 'GLOBAL_AI_API_KEY' } });
  console.log('Global Key exists:', !!globalKey);
}
check().catch(console.error).finally(() => process.exit(0));

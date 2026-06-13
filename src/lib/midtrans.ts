import midtransClient from 'midtrans-client';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function getMidtransConfig() {
  const isProdSetting = await prisma.systemSetting.findUnique({ where: { key: 'MIDTRANS_IS_PRODUCTION' } });
  const clientKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'MIDTRANS_CLIENT_KEY' } });
  const serverKeyCred = await prisma.secretCredential.findUnique({ where: { key: 'MIDTRANS_SERVER_KEY' } });

  const envIsProd = process.env.NODE_ENV === 'production' && process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const isProduction = isProdSetting ? isProdSetting.value === 'true' : envIsProd;

  let serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SANDBOX_KEY';
  if (serverKeyCred?.isActive && serverKeyCred?.encryptedValue) {
    try {
      serverKey = decrypt(serverKeyCred.encryptedValue);
    } catch {
      // fallback to env
    }
  }

  const clientKey = clientKeySetting?.value || process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_SANDBOX_KEY';

  return { isProduction, serverKey, clientKey };
}

// Snap API is used to generate front-end payment tokens and redirect URLs
export async function getMidtransSnap() {
  const { isProduction, serverKey, clientKey } = await getMidtransConfig();
  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

// Core API is used for advanced backend-to-backend operations
export async function getMidtransCoreApi() {
  const { isProduction, serverKey, clientKey } = await getMidtransConfig();
  return new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey,
  });
}

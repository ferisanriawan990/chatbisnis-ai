import midtransClient from 'midtrans-client';

const isProduction = process.env.NODE_ENV === 'production' && process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Snap API is used to generate front-end payment tokens and redirect URLs
export const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SANDBOX_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_SANDBOX_KEY',
});

// Core API is used for advanced backend-to-backend operations (rarely needed for basic Snap integration, but good to have)
export const coreApi = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SANDBOX_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_SANDBOX_KEY',
});

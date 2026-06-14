import { randomBytes } from 'crypto';

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Mock Email Service. 
 * In production, replace console.log with Resend / Nodemailer logic.
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  
  console.log('====================================================');
  console.log(`[MOCK EMAIL] Verification sent to: ${email}`);
  console.log(`[MOCK EMAIL] Click this link to verify your account:`);
  console.log(`[MOCK EMAIL] ${verifyUrl}`);
  console.log('====================================================');
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login/reset-password?token=${token}`;
  
  console.log('====================================================');
  console.log(`[MOCK EMAIL] Password Reset sent to: ${email}`);
  console.log(`[MOCK EMAIL] Click this link to reset your password:`);
  console.log(`[MOCK EMAIL] ${resetUrl}`);
  console.log('====================================================');
}

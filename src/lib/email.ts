import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'; // Ganti dengan email asli domain Anda nantinya

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Mengirim Email Verifikasi (Asli jika API Key ada, Mock jika tidak ada)
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  
  if (resend) {
    try {
      await resend.emails.send({
        from: `ChatBisnis AI <${FROM_EMAIL}>`,
        to: email,
        subject: 'Verifikasi Akun ChatBisnis AI',
        html: `<p>Halo,</p><p>Terima kasih telah mendaftar di ChatBisnis AI. Silakan klik tautan di bawah ini untuk memverifikasi alamat email Anda:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
      console.log(`[EMAIL] Verification sent to: ${email}`);
      return;
    } catch (error) {
      console.error('[EMAIL ERROR] Failed to send verification via Resend:', error);
      // Fallback ke mock jika error
    }
  }

  // Fallback / Mock
  console.log('====================================================');
  console.log(`[MOCK EMAIL] Verification sent to: ${email}`);
  console.log(`[MOCK EMAIL] Click this link to verify your account:`);
  console.log(`[MOCK EMAIL] ${verifyUrl}`);
  console.log('====================================================');
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login/reset-password?token=${token}`;
  
  if (resend) {
    try {
      await resend.emails.send({
        from: `ChatBisnis AI Security <${FROM_EMAIL}>`,
        to: email,
        subject: 'Pemulihan Kata Sandi ChatBisnis AI',
        html: `<p>Halo,</p><p>Sistem kami menerima permintaan pemulihan kata sandi. Silakan klik tautan di bawah ini untuk mereset kata sandi Anda:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Abaikan email ini jika Anda tidak memintanya.</p>`,
      });
      console.log(`[EMAIL] Password reset sent to: ${email}`);
      return;
    } catch (error) {
      console.error('[EMAIL ERROR] Failed to send reset via Resend:', error);
    }
  }

  // Fallback / Mock
  console.log('====================================================');
  console.log(`[MOCK EMAIL] Password Reset sent to: ${email}`);
  console.log(`[MOCK EMAIL] Click this link to reset your password:`);
  console.log(`[MOCK EMAIL] ${resetUrl}`);
  console.log('====================================================');
}

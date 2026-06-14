import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '@/lib/crypto';

describe('Crypto Service', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_SECRET = '32_character_long_secret_string_1234';
  });

  it('should encrypt and decrypt correctly', () => {
    const rawText = 'my_super_secret_whatsapp_key';
    const encrypted = encrypt(rawText);
    
    expect(encrypted).not.toBe(rawText);
    expect(encrypted.includes(':')).toBe(true);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawText);
  });

  it('should throw an error on invalid decryption', () => {
    expect(() => decrypt('invalid_format_string')).toThrow();
  });
});

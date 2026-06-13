const crypto = require('crypto');

function timingSafeEqualString(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const secret1 = "1d2ff29e6bf9888e9c8f32624ab901d4a4c1f9a7f458070fb590de4c37d9d502";
const secret2 = "1d2ff29e6bf9888e9c8f32624ab901d4a4c1f9a7f458070fb590de4c37d9d502";

console.log('Equals?', timingSafeEqualString(secret1, secret2));

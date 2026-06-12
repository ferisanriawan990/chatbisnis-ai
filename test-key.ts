import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';

async function main() {
  const globalCredentials = await prisma.secretCredential.findMany({
    where: { key: 'FLAZ_API_KEY_GLOBAL' },
  });
  const globalKey = globalCredentials[0];
  if (!globalKey) return console.log("No global key found");
  
  const decryptedKey = decrypt(globalKey.encryptedValue);
  console.log("Key format correct:", decryptedKey.startsWith("sk-flaz-"));
  
  const res = await fetch("https://ai.flaz.id/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${decryptedKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "halo" }]
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { decrypt } = require('./src/lib/crypto');

async function test() {
  const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
  const apiKey = decrypt(globalKey.encryptedValue);
  const model = "Gemini 3.1 Pro (High)";

  const payload = {
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { 
        role: "user", 
        content: [
          { type: "text", text: "What do you see in this image? Be specific." },
          { type: "image_url", image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" } }
        ] 
      }
    ]
  };

  const res = await fetch("https://ai.flaz.id/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());

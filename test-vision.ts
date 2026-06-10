import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';
import { AIService } from './src/lib/ai';

async function test() {
  const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
  const apiKey = decrypt(globalKey!.encryptedValue);
  const globalModel = await prisma.secretCredential.findUnique({ where: { key: 'GLOBAL_AI_MODEL' } });
  const model = globalModel ? decrypt(globalModel.encryptedValue) : 'gpt-4o-mini';

  console.log("Model:", model);

  const dummyImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  try {
    const result = await AIService.generateReply({
      systemPrompt: "You are a helpful assistant. Please describe the image you see.",
      userMessage: "What color is this image?",
      imageUrl: dummyImageBase64,
      provider: 'Flaz Cloud',
      model,
      apiKey
    });
    console.log("Result:", result);
  } catch (err) {
    console.error("Error:", err);
  }
}

test().finally(() => process.exit(0));

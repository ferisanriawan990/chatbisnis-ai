// I need a way to test the zod schema and route logic
const { saveChatbotSchema } = require('./src/lib/validations');

function test() {
  const body = {
    businessName: "Test",
    businessIndustry: "Retail",
    botName: "Bot",
    useEmoji: false,
    allowSelling: false,
    allowPromoOffer: false,
    allowVision: true,
    allowVoiceNote: true
  };
  
  const parsed = saveChatbotSchema.safeParse(body);
  if (!parsed.success) {
    console.log("Validation failed:", parsed.error);
  } else {
    console.log("Validation passed:", parsed.data.useEmoji, parsed.data.allowSelling, parsed.data.allowVision);
  }
}

test();

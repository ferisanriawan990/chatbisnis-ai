const { buildSystemPrompt } = require('./src/lib/prompt-builder.ts');

const profile = {
  businessName: "Goda Official Tigaraksa",
  businessIndustry: "Retail",
  businessDescription: "Goda Official Tigaraksa adalah dealer resmi...",
  address: "Jl. Perumahan Sudirman Indah...",
  openingHours: "09:00 - 00:00",
  adminPhone: "081380930755"
};

const setting = {
  toneStyle: "Santai",
  language: "id",
  useEmoji: true,
  maxReplyLength: "sedang",
  allowSelling: true,
  allowPromoOffer: true
};

const botConfig = {
  template: {
    systemPrompt: "Kamu adalah CS toko retail..."
  }
};

const prompt = buildSystemPrompt({
  templatePrompt: botConfig.template.systemPrompt,
  botName: "CS Goda",
  businessProfile: profile,
  chatbotSetting: setting,
  catalogUrl: "https://docs.google.com...",
  relevantKnowledge: ""
});

console.log(prompt);

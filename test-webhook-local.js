const crypto = require('crypto');

async function sendWebhook() {
  const secret = 'Feriswn990_GatewayKey_2026_Secure123!';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = {
    event: 'message.received',
    sessionId: 'biz-3f890443-ba6c-41eb-b494-55f6518ce4b4',
    messageId: 'TEST_' + Date.now(),
    from: '6285218031069@s.whatsapp.net',
    to: '123456@s.whatsapp.net',
    type: 'text',
    text: 'halo',
    timestamp: Number(timestamp),
    isGroup: false
  };

  const rawBody = JSON.stringify(payload);
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const signature = `sha256=${digest}`;

  const res = await fetch('https://chatbisnis-ai.vercel.app/api/webhooks/baileys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-timestamp': timestamp,
      'x-webhook-signature': signature,
    },
    body: rawBody
  });

  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}

sendWebhook();

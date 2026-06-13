const fs = require('fs');
const path = require('path');

const directories = ['./src', './scripts', '.'];

const replacements = [
  { from: /wahaServerId/g, to: 'whatsappServerId' },
  { from: /wahaSessionName/g, to: 'whatsappSessionName' },
  { from: /wahaBaseUrl/g, to: 'whatsappBaseUrl' },
  { from: /wahaApiKeyEncrypted/g, to: 'whatsappApiKeyEncrypted' },
  { from: /wahaApiKeyConfigured/g, to: 'whatsappApiKeyConfigured' },
  { from: /WahaServer/g, to: 'WhatsappServer' },
  { from: /wahaServer/g, to: 'whatsappServer' },
  { from: /WAHAService/g, to: 'WhatsappService' },
  { from: /wahaInstance/g, to: 'whatsappInstance' },
  { from: /getWahaCoreMode/g, to: 'getWhatsappCoreMode' },
  { from: /getActiveWahaSessionName/g, to: 'getActiveWhatsappSessionName' },
  { from: /resolveWahaServerForUser/g, to: 'resolveWhatsappServerForUser' },
  { from: /\/api\/dashboard\/waha/g, to: '/api/dashboard/whatsapp' },
  { from: /\/api\/webhooks\/waha/g, to: '/api/webhooks/whatsapp' },
  { from: /\/admin\/waha-servers/g, to: '/admin/whatsapp-servers' },
  { from: /\/api\/admin\/waha-servers/g, to: '/api/admin/whatsapp-servers' },
  { from: /waha-servers/g, to: 'whatsapp-servers' },
  { from: /@\/lib\/waha'/g, to: "@/lib/whatsapp'" },
  { from: /@\/lib\/waha"/g, to: '@/lib/whatsapp"' },
  { from: /@\/lib\/waha-helpers'/g, to: "@/lib/whatsapp-helpers'" },
  { from: /@\/lib\/waha-helpers"/g, to: '@/lib/whatsapp-helpers"' },
  { from: /WAHA_WEBHOOK_SECRET/g, to: 'WHATSAPP_WEBHOOK_SECRET' },
  { from: /waha-webhook-n8n/g, to: 'whatsapp-webhook-n8n' },
  { from: /webhook-waha/g, to: 'webhook-whatsapp' },
  { from: /Webhook WAHA/g, to: 'Webhook WhatsApp' },
  { from: /x-waha-server-id/g, to: 'x-whatsapp-server-id' },
  { from: /WAHA_CORE_MODE/g, to: 'WHATSAPP_CORE_MODE' },
  { from: /waha-ai-cs-basic/g, to: 'whatsapp-ai-cs-basic' },
  { from: /waha-ai-cs-product/g, to: 'whatsapp-ai-cs-product' },
  { from: /waha-lead-capture/g, to: 'whatsapp-lead-capture' },
  { from: /waha-human-handover/g, to: 'whatsapp-human-handover' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else {
      if (
        fullPath.endsWith('.ts') ||
        fullPath.endsWith('.tsx') ||
        fullPath.endsWith('.json') ||
        fullPath.endsWith('.md')
      ) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;

        for (const replacement of replacements) {
          if (replacement.from.test(content)) {
            content = content.replace(replacement.from, replacement.to);
            changed = true;
          }
        }

        if (changed) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

for (const dir of directories) {
  if (fs.existsSync(dir)) {
    if (fs.statSync(dir).isDirectory()) {
      processDirectory(dir);
    }
  }
}
console.log('Refactoring complete.');

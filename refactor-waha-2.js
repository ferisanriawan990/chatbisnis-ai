const fs = require('fs');
const path = require('path');

const directories = ['./src', './scripts', '.'];

const replacements = [
  { from: /wahaStatus/g, to: 'whatsappStatus' },
  { from: /setWahaStatus/g, to: 'setWhatsappStatus' },
  { from: /activeWahaSessions/g, to: 'activeWhatsappSessions' },
  { from: /failedWahaSessions/g, to: 'failedWhatsappSessions' },
  { from: /WahaDashboard/g, to: 'WhatsappDashboard' },
  { from: /id: 'waha'/g, to: "id: 'whatsapp'" },
  { from: /id: "waha"/g, to: 'id: "whatsapp"' },
  { from: /WAHAConfig/g, to: 'WhatsappConfig' },
  { from: /WAHASessionStatus/g, to: 'WhatsappSessionStatus' },
  { from: /WAHAMediaSendResult/g, to: 'WhatsappMediaSendResult' },
  { from: /WAHAApiError/g, to: 'WhatsappApiError' },
  { from: /WAHAService/g, to: 'WhatsappService' },
  { from: /getWahaCoreMode/g, to: 'getWhatsappCoreMode' },
  { from: /getActiveWahaSessionName/g, to: 'getActiveWhatsappSessionName' },
  { from: /resolveWahaServerForUser/g, to: 'resolveWhatsappServerForUser' },
  { from: /assertUserOwnsWahaSession/g, to: 'assertUserOwnsWhatsappSession' },
  { from: /WAHA Servers/g, to: 'WhatsApp Servers' },
  { from: /WAHA Server/g, to: 'WhatsApp Server' },
  { from: /WAHA_BASE_URL/g, to: 'WHATSAPP_BASE_URL' },
  { from: /WAHA_API_KEY/g, to: 'WHATSAPP_API_KEY' },
  { from: /WAHA /g, to: 'WhatsApp ' },
  { from: /waha\.domainanda/g, to: 'whatsapp.domainanda' },
  // specific ui text
  { from: />WAHA</g, to: '>WhatsApp<' },
  { from: /> WAHA</g, to: '> WhatsApp<' },
  { from: /"WAHA"/g, to: '"WhatsApp"' },
  { from: /'WAHA'/g, to: "'WhatsApp'" },
  // sidebars and menus
  { from: /label: 'WAHA'/g, to: "label: 'WhatsApp'" },
  { from: /label: "WAHA"/g, to: 'label: "WhatsApp"' },
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

        // Skip Prisma schema entirely to avoid breaking @map
        if (file === 'schema.prisma') continue;

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
console.log('Refactoring round 2 complete.');

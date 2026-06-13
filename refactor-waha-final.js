const fs = require('fs');
const path = require('path');

const directories = ['./src', './scripts', '.', './docs', './public'];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'prisma'].includes(file)) {
        processDirectory(fullPath);
      }
    } else {
      if (
        fullPath.endsWith('.ts') ||
        fullPath.endsWith('.tsx') ||
        fullPath.endsWith('.md') ||
        fullPath.endsWith('.json')
      ) {
        // Skip specific files we don't want to mess up
        if (
          file === 'schema.prisma' || 
          file === 'refactor-waha.js' || 
          file === 'refactor-waha-2.js' ||
          file === 'refactor-waha-final.js' ||
          file === 'seed-api-key.js' ||
          file === 'seed-api-key.ts' ||
          file === 'package.json' ||
          file === 'package-lock.json' ||
          fullPath.includes('migration.sql') ||
          fullPath.includes('tsconfig.tsbuildinfo')
        ) {
          continue;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;

        // Case-preserving replacements
        const wahaRegex = /waha/gi;
        
        if (wahaRegex.test(content)) {
          content = content.replace(wahaRegex, (match) => {
            if (match === 'WAHA') return 'WHATSAPP';
            if (match === 'Waha') return 'Whatsapp';
            if (match === 'waha') return 'whatsapp';
            return 'whatsapp'; // fallback
          });
          changed = true;
        }

        // Additional fix: WHATSAPP -> WhatsApp for better UI text (only isolated words)
        if (content.includes('WHATSAPP')) {
          content = content.replace(/\bWHATSAPP\b/g, 'WhatsApp');
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
      if (!['node_modules', '.next', '.git', 'prisma'].includes(path.basename(dir))) {
        processDirectory(dir);
      }
    }
  }
}
console.log('Final purge complete.');

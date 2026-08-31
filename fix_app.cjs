const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      if (typeof tg.requestFullscreen === 'function') {
        try {
          tg.requestFullscreen();
        } catch (e) {
          console.error("Telegram requestFullscreen error:", e);
        }
      }`;

const replacement = `      if (typeof tg.requestFullscreen === 'function') {
        try {
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) {
            tg.requestFullscreen();
          }
        } catch (e) {
          // Suppress error on unsupported clients
        }
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx');

const fs = require('fs');
let code = fs.readFileSync('src/services/adsgramService.ts', 'utf8');
code = code.replace("WATCH_AD: 'int-39490'", "WATCH_AD: 'int-45443'");
fs.writeFileSync('src/services/adsgramService.ts', code);
console.log('patched adsgramService.ts');

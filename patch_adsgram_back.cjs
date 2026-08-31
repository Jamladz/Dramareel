const fs = require('fs');
let code = fs.readFileSync('src/services/adsgramService.ts', 'utf8');

code = code.replace(
  'export const ADSGRAM_BLOCK_ID = "int-45442";',
  'export const ADSGRAM_BLOCK_ID = "45442";'
);

fs.writeFileSync('src/services/adsgramService.ts', code);
console.log('patched adsgramService.ts back');

const fs = require('fs');
let code = fs.readFileSync('src/services/userService.ts', 'utf8');
code = code.replace(/\\nexport async function/g, 'export async function');
fs.writeFileSync('src/services/userService.ts', code);

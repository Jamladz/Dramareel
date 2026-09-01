const fs = require('fs');
let code = fs.readFileSync('functions/api/adsgram/reward.ts', 'utf8');
code = code.replace("const REWARD_POINTS = 100;", "const REWARD_POINTS = 30;");
fs.writeFileSync('functions/api/adsgram/reward.ts', code);
console.log('patched adsgram reward');

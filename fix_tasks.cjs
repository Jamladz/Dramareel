const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');
code = code.replace('totalCoinsEarned,', ''); // remove invalid destructuring
fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('Fixed Tasks.tsx');

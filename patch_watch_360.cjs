const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// We have three places where 1200 is used
code = code.replace(/1200/g, '360');

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx 360');

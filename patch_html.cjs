const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace('src="//libtl.com/sdk.js"', 'src="https://libtl.com/sdk.js"');
fs.writeFileSync('index.html', code);
console.log('patched index.html');

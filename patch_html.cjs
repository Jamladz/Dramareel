const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('libtl.com/sdk.js')) {
  code = code.replace(
    '</head>',
    '    <script src="//libtl.com/sdk.js" data-zone="11695307" data-sdk="show_11695307"></script>\n  </head>'
  );
  fs.writeFileSync('index.html', code);
  console.log('patched index.html');
}

const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');
content = content.replace(/\n              <\/div>\n              <\/div>/g, '\n              </div>');
fs.writeFileSync('src/pages/Watch.tsx', content);

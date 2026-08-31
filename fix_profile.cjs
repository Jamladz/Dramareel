const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// I accidentally duplicated the closing divs and maybe missed replacing the original properly.
// Let's remove the extra closing divs that I injected.

code = code.replace(
  '          </div>\n        </div>\n\n        {/* TON Crypto Subscription Section */}',
  '        {/* TON Crypto Subscription Section */}'
);

fs.writeFileSync('src/pages/Profile.tsx', code);
console.log('fixed extra divs in Profile.tsx');

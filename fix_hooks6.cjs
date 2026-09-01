const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// The `if (!movie)` at line 240 inside Watch.tsx is completely empty or just returning nothing.
// Let's remove it entirely.
code = code.replace(
  /if \(!movie\) \{\s*navigate\('\/'\);\s*\}/,
  ""
);

fs.writeFileSync('src/pages/Watch.tsx', code);

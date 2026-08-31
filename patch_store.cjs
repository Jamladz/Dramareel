const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

// Find where `getTotalCoinsEarned:` is and append `setCoinsFromServer: () => {},`
code = code.replace(
  "getTotalCoinsEarned: () => 0,",
  "getTotalCoinsEarned: () => 0,\n    setCoinsFromServer: () => {},"
);

fs.writeFileSync('src/store.ts', code);
console.log('patched store.ts');

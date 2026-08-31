const fs = require('fs');

let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// replace `user?.id` with `getCurrentUserId()`
// and `[user?.id]` with `[]` (since it's a synchronous function that doesn't change, we can just run it once, or on mount).
code = code.replace(/user\?\.id/g, 'getCurrentUserId()');
code = code.replace(/getUserData\(user\.id\)/g, 'getUserData(getCurrentUserId())');

fs.writeFileSync('src/pages/Profile.tsx', code);
console.log('patched Profile.tsx');

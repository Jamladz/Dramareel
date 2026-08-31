const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// We want to remove:
// 1. Daily Streak UI block (from the start of {/* Daily Streak Section */} down to before {/* Stats Grid */})
// 2. The entire {/* Earn Coins Actions */} section up to {/* TON Crypto Subscription Section */}

// Remove Earn Coins Actions:
code = code.replace(/\{\/\* Earn Coins Actions \*\/\}[\s\S]*?(?=\{\/\* TON Crypto Subscription Section \*\/|\{\/\* AdsGram Reward Ad Task \*\/)/g, '');

// Also clean up any extra Adsgram buttons if they were duplicated:
code = code.replace(/\{\/\* AdsGram Reward Ad Task \*\/\}[\s\S]*?(?=\{\/\* TON Crypto Subscription Section \*\/)/g, '');

// Removing Daily streak logic inside Profile component is not strictly necessary if we don't render it, but we can clean up the UI part
code = code.replace(/\{\/\* Daily Streak Section \*\/\}[\s\S]*?(?=\{\/\* Stats Grid \*\/)/g, '');

fs.writeFileSync('src/pages/Profile.tsx', code);
console.log('Profile cleaned');

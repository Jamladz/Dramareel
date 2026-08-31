const fs = require('fs');

let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

code = code.replace(/const user = useAppStore\.getState\(\)\.user;\s*if \(user\?\.id\)/g, 'if (getCurrentUserId())');
code = code.replace(/getUserData\(user\.id\)/g, 'getUserData(getCurrentUserId())');

fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('patched PointsStoreModal.tsx');

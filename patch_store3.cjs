const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(
  "addCoins: (amount, reason = 'إضافة نقاط') => set((state) => {",
  "setCoinsFromServer: (coins) => set({ coins }),\n      addCoins: (amount, reason = 'إضافة نقاط') => set((state) => {"
);

fs.writeFileSync('src/store.ts', code);
console.log('patched store.ts setCoinsFromServer');

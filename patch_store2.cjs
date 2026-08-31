const fs = require('fs');
let storeCode = fs.readFileSync('src/store.ts', 'utf8');

if (!storeCode.includes('setCoinsFromServer')) {
  storeCode = storeCode.replace(
    'addCoins: (amount: number, reason?: string) => void;',
    'addCoins: (amount: number, reason?: string) => void;\n  setCoinsFromServer: (coins: number) => void;'
  );
  storeCode = storeCode.replace(
    'addCoins: (amount, reason) =>',
    'setCoinsFromServer: (coins) => set({ coins }),\n      addCoins: (amount, reason) =>'
  );
  fs.writeFileSync('src/store.ts', storeCode);
  console.log('patched store.ts with setCoinsFromServer');
}

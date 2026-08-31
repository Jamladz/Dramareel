const fs = require('fs');

let storeCode = fs.readFileSync('src/store.ts', 'utf8');

if (!storeCode.includes('hasJoinedTelegram: boolean')) {
  storeCode = storeCode.replace('coins: number;', 'coins: number;\n  hasJoinedTelegram: boolean;');
  storeCode = storeCode.replace('clearFavorites: () => void;', 'clearFavorites: () => void;\n  setJoinedTelegram: () => void;');
  storeCode = storeCode.replace('coins: 0,', 'coins: 0,\n      hasJoinedTelegram: false,');
  storeCode = storeCode.replace('clearFavorites: () => set', 'setJoinedTelegram: () => set({ hasJoinedTelegram: true }),\n      clearFavorites: () => set');
  fs.writeFileSync('src/store.ts', storeCode);
  console.log('patched src/store.ts');
} else {
  console.log('already patched');
}

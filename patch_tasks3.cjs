const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

code = code.replace(
  "useAppStore.getState().setCoinsFromServer(data.newTotal!);",
  "useAppStore.getState().addCoins(100, isArabic ? 'إعلانات A' : 'Ads A');\n            // useAppStore.getState().setCoinsFromServer(data.newTotal!);"
);

code = code.replace(
  "useAppStore.getState().setCoinsFromServer(data.newTotal!);",
  "useAppStore.getState().addCoins(50, isArabic ? 'زيارة الموقع' : 'Visit Website');\n          // useAppStore.getState().setCoinsFromServer(data.newTotal!);"
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx addCoins');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

// Monetag Claim UI update
code = code.replace(
  "useAppStore.getState().addCoins(100, isArabic ? 'إعلانات A' : 'Ads A');",
  "useAppStore.getState().addCoins(30, isArabic ? 'إعلانات A' : 'Ads A');"
);
code = code.replace(
  "alert(isArabic ? '🎉 حصلت على 100 نقطة' : '🎉 You got 100 points');",
  "alert(isArabic ? '🎉 حصلت على 30 نقطة' : '🎉 You got 30 points');"
);

// Site Visit Claim UI update
code = code.replace(
  "useAppStore.getState().addCoins(50, isArabic ? 'زيارة الموقع' : 'Visit Website');",
  "useAppStore.getState().addCoins(20, isArabic ? 'زيارة الموقع' : 'Visit Website');"
);
code = code.replace(
  "alert(isArabic ? '🎉 حصلت على 50 نقطة لزيارة الموقع' : '🎉 You got 50 points for visiting');",
  "alert(isArabic ? '🎉 حصلت على 20 نقطة لزيارة الموقع' : '🎉 You got 20 points for visiting');"
);

// Monetag Component Prop update
code = code.replace(
  /title=\{isArabic \? 'شاهد إعلان A' : 'Watch Ad A'\}\s*subtitle=\{isArabic \? 'متاح كل 5 دقائق' : 'Available every 5 mins'\}\s*reward="100"/,
  "title={isArabic ? 'شاهد إعلان A' : 'Watch Ad A'}\n            subtitle={isArabic ? 'متاح كل 5 دقائق' : 'Available every 5 mins'}\n            reward=\"30\""
);

// Site Visit Component Prop update
code = code.replace(
  /title=\{isArabic \? 'زيارة الموقع' : 'Visit Website'\}\s*subtitle=\{isArabic \? 'متاح كل 5 دقائق' : 'Available every 5 mins'\}\s*reward="50"/,
  "title={isArabic ? 'زيارة الموقع' : 'Visit Website'}\n            subtitle={isArabic ? 'متاح كل 5 دقائق' : 'Available every 5 mins'}\n            reward=\"20\""
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx rewards');

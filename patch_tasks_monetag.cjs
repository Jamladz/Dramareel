const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

code = code.replace(
  `console.warn("Monetag script not loaded");
      setIsMonetagLoading(false);`,
  `console.warn("Monetag script not loaded");
      alert(isArabic ? 'حدث خطأ في تحميل الإعلان، يرجى إيقاف مانع الإعلانات أو المحاولة لاحقاً.' : 'Ad failed to load. Please disable adblocker or try again later.');
      setIsMonetagLoading(false);`
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx Monetag fallback');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

code = code.replace(
  '<div className="min-h-screen bg-[#050505] text-white pb-32">',
  '<div className="h-full w-full overflow-y-auto bg-[#050505] text-white pb-32" dir={isArabic ? \'rtl\' : \'ltr\'}>'
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx for scrolling');

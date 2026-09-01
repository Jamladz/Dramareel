const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const regex = /<h3 className="text-sm text-white\/50 font-bold uppercase tracking-wider px-1">[\s\S]*?<\/h3>/g;
let matches = code.match(regex);
if (matches && matches.length >= 3) {
  // We want to reconstruct the "Other Tasks" block carefully.
  // We will find the exact block and replace the mess.
}

// A simpler way: we know what it looks like from line 489 to 516.
code = code.replace(
  /<h3 className="text-sm text-white\/50 font-bold uppercase tracking-wider px-1">\s*\{isArabic \? 'مهام أخرى' : 'Other Tasks'\}\s*<\/h3>[\s\S]*?<\/h3>/,
  `<h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'مهام أخرى' : 'Other Tasks'}
          </h3>
          <TaskItem 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
            title={isArabic ? 'إضافة إلى الشاشة الرئيسية' : 'Add to Home Screen'}
            subtitle={isArabic ? 'مكافأة لمرة واحدة' : 'One-time reward'}
            reward="100"
            actionText={isArabic ? 'إضافة' : 'Add'}
            onAction={handleHomeScreenAdd}
            disabled={isHomeScreenAdded}
            loading={isHomeScreenLoading}
            completed={isHomeScreenAdded}
          />`
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('fixed Tasks.tsx');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// 1. Remove old exit button
const exitBtnRegex = /\s*\{\/\* Exit Button \*\/\}\s*<button[\s\S]*?onClick=\{\(\) => navigate\(-1\)\}[\s\S]*?<\/button>\s*/;
code = code.replace(exitBtnRegex, '\n                ');

// 2. Add the global exit button under the top header overlay
const newExitButton = `
      {/* Global Exit Button on the left, matching Sound Toggle height */}
      <div className={\`absolute top-[calc(5.5rem+var(--tg-safe-area-inset-top,env(safe-area-inset-top,0px)))] left-3.5 right-3.5 z-30 flex items-center justify-start pointer-events-none transition-all duration-500 \${
        areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }\`}>
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center text-white/90 border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:bg-black/80 hover:text-white hover:border-white/40 pointer-events-auto"
        >
          <ArrowLeft size={20} className={isArabic ? 'rotate-180' : ''} />
        </button>
      </div>
`;

// Insert after the top header overlay div closes
// Top header ends with:
//         </div>
//       </div>
//
//       {/* Vertical Scroll Container */}

code = code.replace(/(\s*)({\/\* Vertical Scroll Container \*\/})/, (match, p1, p2) => {
  return p1 + newExitButton.trim() + '\n\n' + p1 + p2;
});

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('done');

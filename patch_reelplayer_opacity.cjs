const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

const target = `        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          (!isActive || !isReady) ? "opacity-0" : "opacity-100"
        )}`;

const replacement = `        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          (!isReady) ? "opacity-0" : "opacity-100"
        )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer.tsx for smooth visual transition');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// There are hook calls (`useState`) after `if (!movie) { return ... }` on line 175?
// Wait, the `if (!movie)` is around line 175, let's see.
const match = code.match(/if \(!movie\) {[\s\S]*?}/);
if (match) {
  // Let's remove this early return entirely if it's there, and move it down before the main return statement.
  code = code.replace(match[0], "");
  
  // Find the final return
  code = code.replace(
    "  if (!movie || episodes.length === 0) return null;",
    match[0] + "\n  if (!movie || episodes.length === 0) return null;"
  );
}

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('Fixed Watch.tsx hooks');

const fs = require('fs');
let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

// There's a second hook block we missed maybe?
// Wait, is there an if (!isOpen) return null; at line 157?
// And then what's after that?
// Ah! We moved the `const [isRewardAdLoading...] = useState` to line ~100? No, we moved it under `addingToHome`.
// Let's just remove ALL `if (!isOpen) return null;` occurrences and put exactly one right before the return statement.
// Oh wait, `return createPortal(` is where the component renders.

code = code.replace(/  if \(\!isOpen\) return null;/g, "");

// find return createPortal
code = code.replace(
  "  return createPortal(",
  "  if (!isOpen) return null;\n\n  return createPortal("
);

fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('Fixed PointsStoreModal hooks order completely');

const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

code = code.replace(
  "const togglePlay = () => {\n    const video = videoRef.current;\n    if (!video) return;",
  "const togglePlay = () => {\n    if (forcePause) return;\n    const video = videoRef.current;\n    if (!video) return;"
);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched togglePlay');

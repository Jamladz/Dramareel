const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { ForYou } from './pages/ForYou';",
  "import { Tasks } from './pages/Tasks';"
);
code = code.replace(
  '<Route path="/foryou" element={<ForYou />} />',
  '<Route path="/tasks" element={<Tasks />} />'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx');

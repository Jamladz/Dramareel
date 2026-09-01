const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const oldHandleHomeScreenAdd = /const handleHomeScreenAdd = async \(\) => \{[\s\S]*?setIsHomeScreenLoading\(false\);\s*\}, 2500\);\s*\};/;
const newHandleHomeScreenAdd = `const handleHomeScreenAdd = () => {
    if (isHomeScreenLoading || isHomeScreenAdded) return;
    useAppStore.getState().openHomeScreenModal();
  };`;

code = code.replace(oldHandleHomeScreenAdd, newHandleHomeScreenAdd);
fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx home screen add');

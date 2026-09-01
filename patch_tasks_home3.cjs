const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const regex = /const handleHomeScreenAdd = async \(\) => \{[\s\S]*?const handleSiteVisit = \(\) => \{/;
const replaceStr = `const handleHomeScreenAdd = () => {
    if (isHomeScreenLoading || isHomeScreenAdded) return;
    useAppStore.getState().openHomeScreenModal();
  };

  const handleSiteVisit = () => {`;

if (regex.test(code)) {
  code = code.replace(regex, replaceStr);
  fs.writeFileSync('src/pages/Tasks.tsx', code);
  console.log('patched Tasks.tsx home screen add successfully');
} else {
  console.log('regex did not match');
}

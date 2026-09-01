const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const regex = /const handleHomeScreenAdd = async \(\) => \{[\s\S]*?alert\(isArabic \? 'تمت إضافة 100 نقطة بنجاح 🎉' : 'Added 100 points successfully 🎉'\);[\s\S]*?setIsHomeScreenLoading\(false\);\s*\}\s*\}, 2500\);\s*\};/;

const newHandleHomeScreenAdd = `const handleHomeScreenAdd = () => {
    if (isHomeScreenLoading || isHomeScreenAdded) return;
    useAppStore.getState().openHomeScreenModal();
  };`;

// Because I am not sure about the exact text, I'll just find the function up to the next function.
const altRegex = /const handleHomeScreenAdd = async \(\) => \{[\s\S]*?const handleSiteVisit = async \(\) => \{/;
const replaceStr = `const handleHomeScreenAdd = () => {
    if (isHomeScreenLoading || isHomeScreenAdded) return;
    useAppStore.getState().openHomeScreenModal();
  };

  const handleSiteVisit = async () => {`;

code = code.replace(altRegex, replaceStr);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx home screen add again');

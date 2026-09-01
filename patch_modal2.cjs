const fs = require('fs');
let code = fs.readFileSync('src/components/HomeScreenTaskModal.tsx', 'utf8');

// replace local isVisible state with global state
code = code.replace(
  "  const [isVisible, setIsVisible] = useState(false);",
  "  const { isHomeScreenModalOpen, openHomeScreenModal, closeHomeScreenModal } = useAppStore();\n  const isVisible = isHomeScreenModalOpen;\n  const setIsVisible = (val: boolean) => val ? openHomeScreenModal() : closeHomeScreenModal();"
);

fs.writeFileSync('src/components/HomeScreenTaskModal.tsx', code);
console.log('patched HomeScreenTaskModal.tsx');

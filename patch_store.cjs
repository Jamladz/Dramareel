const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

if (!code.includes('isHomeScreenModalOpen')) {
  code = code.replace(
    "interface AppState {",
    "interface AppState {\n  isHomeScreenModalOpen: boolean;\n  openHomeScreenModal: () => void;\n  closeHomeScreenModal: () => void;"
  );
  code = code.replace(
    "(set, get) => ({",
    "(set, get) => ({\n      isHomeScreenModalOpen: false,\n      openHomeScreenModal: () => set({ isHomeScreenModalOpen: true }),\n      closeHomeScreenModal: () => set({ isHomeScreenModalOpen: false }),"
  );
  fs.writeFileSync('src/store.ts', code);
  console.log('patched store.ts with isHomeScreenModalOpen');
}

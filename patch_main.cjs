const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const suppressCode = `
// Suppress Telegram CloudStorage warning
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('CloudStorage is not supported')) {
    return;
  }
  originalConsoleError(...args);
};
`;

if (!code.includes('originalConsoleError')) {
  code = suppressCode + "\n" + code;
  fs.writeFileSync('src/main.tsx', code);
  console.log('patched main.tsx');
}

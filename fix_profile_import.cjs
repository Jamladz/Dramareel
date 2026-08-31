const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

if (!code.includes("import { getUserData }")) {
  code = code.replace(
    "import { getCurrentUserId, getShareTelegramLink } from '../services/referralService';",
    "import { getCurrentUserId, getShareTelegramLink } from '../services/referralService';\nimport { getUserData } from '../services/userService';"
  );
  fs.writeFileSync('src/pages/Profile.tsx', code);
  console.log('Fixed Profile.tsx import');
}

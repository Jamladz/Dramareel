const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

code = code.replace(
  "claimHomeScreenReward, claimRewardAd } from '../services/userService';",
  "claimHomeScreenReward, claimRewardAd, getTaskStatus, completeTelegramTask } from '../services/userService';"
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx imports');

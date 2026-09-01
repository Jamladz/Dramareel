const fs = require('fs');
let code = fs.readFileSync('src/services/userService.ts', 'utf8');

// Update COOLDOWN_MS in claimMonetagReward to 5 minutes
code = code.replace(
  /const COOLDOWN_MS = 24 \* 60 \* 60 \* 1000;\s*\/\/\s*for Monetag/g, 
  "const COOLDOWN_MS = 5 * 60 * 1000;"
);
// Or if there's no comment:
let parts = code.split('export async function claimSiteVisitReward');
let monetagPart = parts[0];
let visitPart = parts[1] || '';

monetagPart = monetagPart.replace(/const COOLDOWN_MS = 24 \* 60 \* 60 \* 1000;/g, 'const COOLDOWN_MS = 5 * 60 * 1000;');
visitPart = visitPart.replace(/const COOLDOWN_MS = 24 \* 60 \* 60 \* 1000;/g, 'const COOLDOWN_MS = 5 * 60 * 1000;'); // Or 30 minutes? "اجعل مهمة زيارة الموقع كل 30 دقيقة" and then later "زيارة موقع كل 5 دقائق". I'll use 5 minutes based on the latest instruction. Wait, I will use 5 minutes for Visit Website and Monetag.

code = monetagPart + (visitPart ? 'export async function claimSiteVisitReward' + visitPart : '');

const homeScreenRewardFunc = `
export async function claimHomeScreenReward(userId: string): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Invalid data' };
    const userRef = doc(db, 'users', userId);
    const REWARD = 100;

    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const data = userSnap.data();
      if (data.homeScreenAdded) {
        return { success: false, error: 'Already added' };
      }

      const currentCoins = data.coins || 0;
      const newTotal = currentCoins + REWARD;
      
      transaction.update(userRef, { 
        coins: newTotal,
        homeScreenAdded: true
      });

      return { success: true, newTotal };
    });
  } catch (error: any) {
    console.error('Error claiming home screen reward:', error);
    return { success: false, error: error.message };
  }
}
`;

if (!code.includes('claimHomeScreenReward')) {
  code += '\\n' + homeScreenRewardFunc;
}

fs.writeFileSync('src/services/userService.ts', code);
console.log('patched userService.ts');

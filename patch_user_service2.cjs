const fs = require('fs');
let code = fs.readFileSync('src/services/userService.ts', 'utf8');

const claimRewardAdFunc = `
export async function claimRewardAd(userId: string): Promise<{ success: boolean; newTotal?: number; adsWatchedToday?: number; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Invalid data' };
    const userRef = doc(db, 'users', userId);
    const REWARD = 30;
    const DAILY_LIMIT = 20;

    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const data = userSnap.data();
      const currentCoins = data.coins || 0;
      
      const todayStr = new Date().toISOString().split('T')[0];
      let adsWatchedToday = data.adsWatchedToday || 0;
      let dailyAdsDate = data.dailyAdsDate || '';

      if (dailyAdsDate !== todayStr) {
        adsWatchedToday = 0;
        dailyAdsDate = todayStr;
      }

      if (adsWatchedToday >= DAILY_LIMIT) {
         return { success: false, error: 'Daily limit reached' };
      }

      const newTotal = currentCoins + REWARD;
      adsWatchedToday += 1;
      
      transaction.update(userRef, { 
        coins: newTotal,
        adsWatchedToday: adsWatchedToday,
        dailyAdsDate: dailyAdsDate
      });

      return { success: true, newTotal, adsWatchedToday };
    });
  } catch (error: any) {
    console.error('Error claiming reward ad:', error);
    return { success: false, error: error.message };
  }
}
`;

if (!code.includes('claimRewardAd')) {
  code += "\n" + claimRewardAdFunc;
  fs.writeFileSync('src/services/userService.ts', code);
  console.log('patched userService.ts with claimRewardAd');
} else {
  console.log('claimRewardAd already exists');
}

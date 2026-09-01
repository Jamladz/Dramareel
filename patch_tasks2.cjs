const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

// Import
code = code.replace(
  "claimHomeScreenReward } from '../services/userService';",
  "claimHomeScreenReward, claimRewardAd } from '../services/userService';"
);

// handleRewardAd
const oldHandleRewardAd = /const handleRewardAd = async \(\) => \{[\s\S]*?setIsRewardAdLoading\(false\);\s*\}\s*\};/;
const newHandleRewardAd = `const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      alert(isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.');
      return;
    }
    setIsRewardAdLoading(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.REWARD_AD);
      if (success) {
        const uid = getCurrentUserId();
        if (uid) {
           const res = await claimRewardAd(uid);
           if (res.success && res.newTotal !== undefined) {
             useAppStore.getState().setCoinsFromServer(res.newTotal);
             setAdsWatchedCount(res.adsWatchedToday || 0);
             alert(isArabic ? 'تمت إضافة 30 نقطة 🎉' : 'Added 30 points 🎉');
           } else {
             alert(res.error || (isArabic ? 'حدث خطأ' : 'Error'));
           }
        }
      }
    } catch (err) {
      console.error('Reward ad error:', err);
    } finally {
      setIsRewardAdLoading(false);
    }
  };`;

code = code.replace(oldHandleRewardAd, newHandleRewardAd);
fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx handleRewardAd');

const fs = require('fs');
let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

// Import
code = code.replace(
  "import { getTaskStatus, completeTelegramTask, getUserData } from '../services/userService';",
  "import { getTaskStatus, completeTelegramTask, getUserData, claimRewardAd } from '../services/userService';"
);

// handleRewardAd
const oldHandleRewardAd = /const handleRewardAd = async \(\) => \{[\s\S]*?setIsRewardAdLoading\(false\);\s*\}\s*\};/;
const newHandleRewardAd = `const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      setMsg({ text: isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.', success: false });
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
             setMsg({ text: isArabic ? 'تمت إضافة 30 نقطة 🎉' : 'Added 30 points 🎉', success: true });
           } else {
             setMsg({ text: res.error || (isArabic ? 'حدث خطأ' : 'Error'), success: false });
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
fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('patched PointsStoreModal.tsx handleRewardAd');

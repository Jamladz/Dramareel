const fs = require('fs');

let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// 1. Add import for getUserData
if (!code.includes('getUserData')) {
  code = code.replace(
    /import { syncCoinsToFirebase } from '\.\.\/services\/userService';/,
    "import { syncCoinsToFirebase, getUserData } from '../services/userService';"
  );
}

// 2. Add Reward Ad state and handler
const newLogic = `
  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        const data = await getUserData(user.id);
        if (data) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (data.dailyAdsDate === todayStr) {
            setAdsWatchedCount(data.adsWatchedToday || 0);
          } else {
            setAdsWatchedCount(0);
          }
        }
      }
    };
    fetchUserData();
  }, [user?.id]);

  const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      alert(isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.');
      return;
    }
    
    setIsRewardAdLoading(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.REWARD_AD);
      if (success) {
        // Wait 2-3 seconds for backend to process the callback
        await new Promise(r => setTimeout(r, 2500));
        
        // Fetch new balance from backend
        if (user?.id) {
          const data = await getUserData(user.id);
          if (data && data.coins > coins) {
             useAppStore.getState().setCoinsFromServer(data.coins);
             const todayStr = new Date().toISOString().split('T')[0];
             if (data.dailyAdsDate === todayStr) {
               setAdsWatchedCount(data.adsWatchedToday || 0);
             }
             alert(isArabic ? 'تمت إضافة 100 نقطة 🎉' : 'Added 100 points 🎉');
          } else {
             // Fallback if backend didn't update yet or failed
             alert(isArabic ? 'يبدو أن تأكيد المكافأة قد تأخر. سيتم التحديث قريباً.' : 'Reward confirmation delayed. Will update soon.');
          }
        }
      }
    } catch (err) {
      console.error('Reward ad error:', err);
    } finally {
      setIsRewardAdLoading(false);
    }
  };
`;

if (!code.includes('handleRewardAd')) {
  code = code.replace(
    /const handleWatchAd = async \(\) => {/,
    newLogic + '\n  const handleWatchAd = async () => {'
  );
}

// 3. Add the UI block
const newUI = `
            {/* AdsGram Reward Ad Task */}
            <button 
              onClick={handleRewardAd}
              disabled={isRewardAdLoading || adsWatchedCount >= DAILY_AD_LIMIT}
              className="bg-[#1A1A1A] border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-none">
                  <Tv className="text-blue-500" size={16} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-white">
                    {isRewardAdLoading 
                      ? (isArabic ? 'جاري التحميل...' : 'Loading...') 
                      : (isArabic ? '🎬 شاهد إعلان واحصل على مكافأة' : '🎬 Watch Ad for Reward')}
                  </span>
                  <span className="text-[10px] text-white/50 font-mono mt-0.5">
                    {adsWatchedCount}/{DAILY_AD_LIMIT} {isArabic ? 'يومياً' : 'Daily'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <span className="text-xs text-blue-500 font-black bg-blue-500/10 px-2 py-1 rounded-md" dir="ltr">+100</span>
              </div>
            </button>
`;

if (!code.includes('handleRewardAd}')) {
  // Insert before the TON Crypto section
  const searchStr = '{/* TON Crypto Subscription Section */}';
  code = code.replace(
    searchStr,
    newUI + '\n          </div>\n        </div>\n\n        ' + searchStr
  );
  // Wait, I need to make sure I don't break the HTML structure.
  // The tasks are in a grid.
  // The grid is: <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  code = code.replace(/<button \n              onClick=\{handleWatchAd\}/, newUI + '\n            <button \n              onClick={handleWatchAd}');
}

fs.writeFileSync('src/pages/Profile.tsx', code);
console.log('patched Profile.tsx');

const fs = require('fs');

let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

if (!code.includes('getUserData')) {
  code = code.replace(
    /import \{ getTaskStatus, completeTelegramTask \} from '\.\.\/services\/userService';/,
    "import { getTaskStatus, completeTelegramTask, getUserData } from '../services/userService';"
  );
}

const newLogic = `
  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  React.useEffect(() => {
    const fetchUserData = async () => {
      const user = useAppStore.getState().user;
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
    if (isOpen) fetchUserData();
  }, [isOpen]);

  const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      setMsg({ text: isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.', success: false });
      return;
    }
    
    setIsRewardAdLoading(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.REWARD_AD);
      if (success) {
        // Wait 2-3 seconds for backend to process the callback
        await new Promise(r => setTimeout(r, 2500));
        
        // Fetch new balance from backend
        const user = useAppStore.getState().user;
        if (user?.id) {
          const data = await getUserData(user.id);
          if (data && data.coins > coins) {
             useAppStore.getState().setCoinsFromServer(data.coins);
             const todayStr = new Date().toISOString().split('T')[0];
             if (data.dailyAdsDate === todayStr) {
               setAdsWatchedCount(data.adsWatchedToday || 0);
             }
             setMsg({ text: isArabic ? 'تمت إضافة 100 نقطة 🎉' : 'Added 100 points 🎉', success: true });
          } else {
             setMsg({ text: isArabic ? 'يبدو أن تأكيد المكافأة قد تأخر. سيتم التحديث قريباً.' : 'Reward confirmation delayed. Will update soon.', success: false });
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
    /const handleWatchAdReward = async \(\) => {/,
    newLogic + '\n  const handleWatchAdReward = async () => {'
  );
}

const newUI = `
              {/* NEW AdsGram Reward Ad */}
              <button 
                onClick={handleRewardAd}
                disabled={isRewardAdLoading || adsWatchedCount >= DAILY_AD_LIMIT}
                className="bg-gradient-to-b from-blue-950/40 to-[#1A1815] border border-blue-500/30 hover:border-blue-400 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Tv size={18} />
                </div>
                <span className="text-[11px] font-black text-white leading-tight">
                  {isRewardAdLoading ? (isArabic ? 'تحميل...' : 'Loading...') : (isArabic ? 'شاهد إعلان' : 'Watch Ad')}
                </span>
                <span className="text-[10px] text-white/50 font-mono mb-[-4px]">
                    {adsWatchedCount}/{DAILY_AD_LIMIT}
                </span>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                  +100 {isArabic ? 'نقطة' : 'pts'}
                </span>
              </button>
`;

if (!code.includes('NEW AdsGram Reward Ad')) {
  // Let's replace the grid layout from grid-cols-3 to grid-cols-2 sm:grid-cols-4 and add the button
  code = code.replace(
    /className="grid grid-cols-3 gap-2"/,
    'className="grid grid-cols-2 sm:grid-cols-4 gap-2"'
  );
  
  code = code.replace(
    /\{\/\* 2\. Watch Ad \*\/\}/,
    newUI + '\n              {/* 2. Watch Ad */}'
  );
}

fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('patched PointsStoreModal.tsx');

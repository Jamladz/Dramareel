const fs = require('fs');
let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

const hookLines = `  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (getCurrentUserId()) {
        const data = await getUserData(getCurrentUserId());
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
  }, [isOpen]);`;

// Remove them from current place
code = code.replace(hookLines, "");

// Insert them just below addingToHome state
const target = "  const [addingToHome, setAddingToHome] = useState(false);";
code = code.replace(target, target + "\n" + hookLines);

fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('Fixed PointsStoreModal hooks order again');

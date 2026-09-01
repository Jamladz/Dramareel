const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const oldFetch = `  useEffect(() => {
    const fetchUserData = async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const data = await getUserData(uid);
        if (data) {
          if (data.lastMonetagClaim) {
            setLastMonetagClaim(Number(data.lastMonetagClaim) || 0);
          }
          if (data.lastSiteVisitClaim) {
            setLastSiteVisitClaim(Number(data.lastSiteVisitClaim) || 0);
          }
          if (data.homeScreenAdded) {
            setIsHomeScreenAdded(true);
          }
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
  }, []);`;

const newFetch = `  useEffect(() => {
    const fetchUserData = async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const data = await getUserData(uid);
        if (data) {
          if (data.lastMonetagClaim) {
            setLastMonetagClaim(Number(data.lastMonetagClaim) || 0);
          }
          if (data.lastSiteVisitClaim) {
            setLastSiteVisitClaim(Number(data.lastSiteVisitClaim) || 0);
          }
          if (data.homeScreenAdded) {
            setIsHomeScreenAdded(true);
          }
          const todayStr = new Date().toISOString().split('T')[0];
          if (data.dailyAdsDate === todayStr) {
            setAdsWatchedCount(data.adsWatchedToday || 0);
          } else {
            setAdsWatchedCount(0);
          }
        }
        
        const hasJoined = await getTaskStatus(uid, 'join_channel');
        if (hasJoined && !hasJoinedTelegram) {
           setJoinedTelegram();
        }
      }
    };
    fetchUserData();
  }, []);`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx fetchUserData');

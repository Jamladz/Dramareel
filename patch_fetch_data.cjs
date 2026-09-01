const fs = require('fs');
let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

const oldFetchUserData = `    const fetchUserData = async () => {
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
    };`;

const newFetchUserData = `    const fetchUserData = async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const data = await getUserData(uid);
        if (data) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (data.dailyAdsDate === todayStr) {
            setAdsWatchedCount(data.adsWatchedToday || 0);
          } else {
            setAdsWatchedCount(0);
          }
        }
        const hasJoined = await getTaskStatus(uid, 'join_channel');
        if (hasJoined && !useAppStore.getState().hasJoinedTelegram) {
          useAppStore.getState().setJoinedTelegram();
        }
      }
    };`;

code = code.replace(oldFetchUserData, newFetchUserData);
fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('patched fetchUserData in PointsStoreModal');

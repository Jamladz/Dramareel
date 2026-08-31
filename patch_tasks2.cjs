const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

code = code.replace(
  "import { getUserData } from '../services/userService';",
  "import { getUserData, claimMonetagReward, claimSiteVisitReward } from '../services/userService';"
);

// Monetag fetch
const oldMonetagFetch = `
        try {
          const res = await fetch('/api/monetag/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid: uid })
          });
          const data = await res.json();
          if (data.success) {
            useAppStore.getState().setCoinsFromServer(data.newTotal);
            setLastMonetagClaim(data.lastClaim);
            alert(isArabic ? '🎉 حصلت على 100 نقطة' : '🎉 You got 100 points');
          } else {
             if (data.remainingMs) {
                setLastMonetagClaim(Date.now() - (MONETAG_COOLDOWN_MS - data.remainingMs));
             }
             alert(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet');
          }
        } catch (e) {
          console.error("Claim error:", e);
        } finally {
          setIsMonetagLoading(false);
        }
`;

const newMonetagFetch = `
        try {
          const data = await claimMonetagReward(uid);
          if (data.success) {
            useAppStore.getState().setCoinsFromServer(data.newTotal!);
            setLastMonetagClaim(data.lastClaim!);
            alert(isArabic ? '🎉 حصلت على 100 نقطة' : '🎉 You got 100 points');
          } else {
             if (data.remainingMs) {
                setLastMonetagClaim(Date.now() - (MONETAG_COOLDOWN_MS - data.remainingMs));
             }
             alert(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet');
          }
        } catch (e) {
          console.error("Claim error:", e);
        } finally {
          setIsMonetagLoading(false);
        }
`;

code = code.replace(oldMonetagFetch, newMonetagFetch);

// Site Visit fetch
const oldVisitFetch = `
      try {
        const res = await fetch('/api/visit/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid: uid })
        });
        const data = await res.json();
        
        if (data.success) {
          useAppStore.getState().setCoinsFromServer(data.newTotal);
          setLastSiteVisitClaim(data.lastClaim);
          alert(isArabic ? '🎉 حصلت على 50 نقطة لزيارة الموقع' : '🎉 You got 50 points for visiting');
        } else {
           if (data.remainingMs) {
              setLastSiteVisitClaim(Date.now() - (SITE_VISIT_COOLDOWN_MS - data.remainingMs));
           }
           alert(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet');
        }
      } catch (e) {
        console.error("Site visit claim error:", e);
        alert(isArabic ? 'حدث خطأ. يرجى المحاولة لاحقاً.' : 'Error occurred. Please try again later.');
      } finally {
        setIsSiteVisitLoading(false);
      }
`;

const newVisitFetch = `
      try {
        const data = await claimSiteVisitReward(uid);
        if (data.success) {
          useAppStore.getState().setCoinsFromServer(data.newTotal!);
          setLastSiteVisitClaim(data.lastClaim!);
          alert(isArabic ? '🎉 حصلت على 50 نقطة لزيارة الموقع' : '🎉 You got 50 points for visiting');
        } else {
           if (data.remainingMs) {
              setLastSiteVisitClaim(Date.now() - (SITE_VISIT_COOLDOWN_MS - data.remainingMs));
           }
           alert(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet');
        }
      } catch (e) {
        console.error("Site visit claim error:", e);
        alert(isArabic ? 'حدث خطأ. يرجى المحاولة لاحقاً.' : 'Error occurred. Please try again later.');
      } finally {
        setIsSiteVisitLoading(false);
      }
`;

code = code.replace(oldVisitFetch, newVisitFetch);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx APIs');

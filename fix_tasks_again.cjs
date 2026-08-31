const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const monetagStr = `            useAppStore.getState().addCoins(100, isArabic ? 'إعلانات A' : 'Ads A');
            // useAppStore.getState().addCoins(50, isArabic ? 'زيارة الموقع' : 'Visit Website');
          // useAppStore.getState().setCoinsFromServer(data.newTotal!);
            setLastMonetagClaim(data.lastClaim!);`;

const monetagFixed = `            useAppStore.getState().addCoins(100, isArabic ? 'إعلانات A' : 'Ads A');
            setLastMonetagClaim(data.lastClaim!);`;

code = code.replace(monetagStr, monetagFixed);

const visitStr = `        if (data.success) {
          useAppStore.getState().setCoinsFromServer(data.newTotal!);
          setLastSiteVisitClaim(data.lastClaim!);`;

const visitFixed = `        if (data.success) {
          useAppStore.getState().addCoins(50, isArabic ? 'زيارة الموقع' : 'Visit Website');
          setLastSiteVisitClaim(data.lastClaim!);`;

code = code.replace(visitStr, visitFixed);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('fixed Tasks.tsx again');

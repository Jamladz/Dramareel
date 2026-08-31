const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

// 1. Title Changes
code = code.replace(
  "{isArabic ? 'اعلانات Monetag' : 'Monetag Ads'}",
  "{isArabic ? 'إعلانات A' : 'Ads A'}"
);
code = code.replace(
  "{isArabic ? 'شاهد إعلان Monetag' : 'Watch Monetag Ad'}",
  "{isArabic ? 'شاهد إعلان A' : 'Watch Ad A'}"
);
code = code.replace(
  "{isArabic ? 'اعلانات Adsgram' : 'Adsgram Ads'}",
  "{isArabic ? 'إعلانات B' : 'Ads B'}"
);
code = code.replace(
  "{isArabic ? 'مكافأة إعلانات Adsgram' : 'Adsgram Ad Reward'}",
  "{isArabic ? 'مكافأة إعلان B' : 'Ad B Reward'}"
);

// 2. Add Site Visit State
const stateToAdd = `
  // Site Visit State
  const [isSiteVisitLoading, setIsSiteVisitLoading] = useState(false);
  const [lastSiteVisitClaim, setLastSiteVisitClaim] = useState<number>(0);
  const [siteVisitTimeLeft, setSiteVisitTimeLeft] = useState<string | null>(null);
  const SITE_VISIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
`;

code = code.replace(
  '// Adsgram general Watch Ad State',
  stateToAdd + '\n  // Adsgram general Watch Ad State'
);

// 3. Add to useEffect user data fetch
const siteVisitFetch = `
          if (data.lastSiteVisitClaim) {
            setLastSiteVisitClaim(Number(data.lastSiteVisitClaim) || 0);
          }
`;

code = code.replace(
  'setLastMonetagClaim(Number(data.lastMonetagClaim) || 0);',
  'setLastMonetagClaim(Number(data.lastMonetagClaim) || 0);\n          }\n          if (data.lastSiteVisitClaim) {\n            setLastSiteVisitClaim(Number(data.lastSiteVisitClaim) || 0);'
);

// 4. Add Site Visit Timer
const siteVisitTimer = `
  // Site Visit Timer
  useEffect(() => {
    if (!lastSiteVisitClaim) {
      setSiteVisitTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = SITE_VISIT_COOLDOWN_MS - (now - lastSiteVisitClaim);
      
      if (diff <= 0) {
        setSiteVisitTimeLeft(null);
        setLastSiteVisitClaim(0);
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setSiteVisitTimeLeft(\`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSiteVisitClaim]);
`;

code = code.replace(
  '// Daily Streak Timer',
  siteVisitTimer + '\n  // Daily Streak Timer'
);

// 5. Add Site Visit Handle Function
const siteVisitHandle = `
  const handleSiteVisit = () => {
    if (isSiteVisitLoading || siteVisitTimeLeft) return;
    setIsSiteVisitLoading(true);
    
    // Open the website in a new tab
    window.open('https://omg10.com/4/11695668', '_blank');
    
    // Add a 5 second delay to simulate user waiting/visiting the site before claiming
    setTimeout(async () => {
      const uid = getCurrentUserId();
      if (!uid) {
        setIsSiteVisitLoading(false);
        return;
      }
      
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
    }, 5000);
  };
`;

code = code.replace(
  'const handleRewardAd = async () => {',
  siteVisitHandle + '\n  const handleRewardAd = async () => {'
);

// 6. Add UI for the Site Visit task
// We'll import Globe or ExternalLink from lucide-react, Globe is usually available.
// Wait, is Globe imported? Let's check imports.
code = code.replace(
  "import { Gift, Tv, CheckCircle, Clock, Film, Users, Share2, Flame, Coins }",
  "import { Gift, Tv, CheckCircle, Clock, Film, Users, Share2, Flame, Coins, Globe }"
);

const siteVisitTaskUI = `
          <TaskItem 
            icon={<Globe size={20} />}
            title={isArabic ? 'زيارة الموقع' : 'Visit Website'}
            subtitle={isArabic ? 'متاح مرة كل 24 ساعة' : 'Available once every 24h'}
            reward="50"
            actionText={isArabic ? 'زيارة' : 'Visit'}
            onAction={handleSiteVisit}
            disabled={!!siteVisitTimeLeft}
            loading={isSiteVisitLoading}
            completed={false}
            timer={siteVisitTimeLeft}
          />
`;

code = code.replace(
  "{isArabic ? 'مهام أخرى' : 'Other Tasks'}\n          </h3>",
  "{isArabic ? 'مهام أخرى' : 'Other Tasks'}\n          </h3>" + siteVisitTaskUI
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx entirely');

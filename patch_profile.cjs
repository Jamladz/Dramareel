const fs = require('fs');

let profileCode = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const telegramTaskBlockProfile = `
            <button 
              onClick={() => {
                if (hasJoinedTelegram) return;
                window.open('https://t.me/dramareel2026', '_blank');
                setTimeout(() => {
                  useAppStore.getState().setJoinedTelegram();
                  useAppStore.getState().addCoins(100, 'انضمام لقناة التلجرام');
                }, 2000);
              }}
              disabled={hasJoinedTelegram}
              className="bg-[#1A1A1A] border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </div>
                <span className="font-bold text-sm text-white">
                  {hasJoinedTelegram 
                    ? (isArabic ? 'مكتملة' : 'Completed') 
                    : (isArabic ? 'انضم إلى قناتنا على تلجرام' : 'Join Telegram Channel')}
                </span>
              </div>
              <span className="text-xs text-cyan-400 font-black bg-cyan-500/10 px-2 py-1 rounded-md" dir="ltr">+100</span>
            </button>
`;

if (!profileCode.includes('hasJoinedTelegram')) {
  profileCode = profileCode.replace(
    /const {\s*user,\s*coins,\s*streakDays,\s*lastDailyReward,\s*premiumUntil,\s*vipType,\s*claimDailyReward,\s*isVipActive,\s*isPaidVip,\s*isPointsVip,\s*getTotalCoinsEarned,\s*moviesCount,\s*seriesCount\s*}/, 
    'const { user, coins, streakDays, lastDailyReward, premiumUntil, vipType, claimDailyReward, isVipActive, isPaidVip, isPointsVip, getTotalCoinsEarned, moviesCount, seriesCount, hasJoinedTelegram, setJoinedTelegram }'
  );
  
  // Inject the new button after the Watch Ad button
  const searchString = '</button>\n          </div>\n        </div>\n\n        {/* TON Crypto Subscription Section */}';
  profileCode = profileCode.replace(searchString, '</button>\n' + telegramTaskBlockProfile + '          </div>\n        </div>\n\n        {/* TON Crypto Subscription Section */}');
  
  fs.writeFileSync('src/pages/Profile.tsx', profileCode);
  console.log('patched profile');
} else {
  console.log('already patched');
}

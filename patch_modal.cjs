const fs = require('fs');

let modalCode = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

const telegramTaskBlock = `
            {/* Join Telegram Channel Task */}
            <div className="mt-3 bg-gradient-to-r from-cyan-950/40 to-[#1A1815] border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-white">
                    {isArabic ? 'انضم إلى قناتنا على تلجرام' : 'Join our Telegram Channel'}
                  </h4>
                  <p className="text-[10px] text-cyan-200/70 font-medium leading-tight max-w-[180px]">
                    {isArabic 
                      ? 'احصل على 100 نقطة فور انضمامك لقناتنا' 
                      : 'Get 100 points for joining our channel'}
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex flex-col items-end gap-2 shrink-0">
                <div className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">
                  +100 {isArabic ? 'نقطة' : 'pts'}
                </div>
                {hasJoinedTelegram ? (
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle2 size={12} /> {isArabic ? 'مكتملة' : 'Completed'}
                  </span>
                ) : (
                  <button 
                    onClick={() => {
                      window.open('https://t.me/dramareel2026', '_blank');
                      setTimeout(() => {
                        useAppStore.getState().setJoinedTelegram();
                        useAppStore.getState().addCoins(100, 'انضمام لقناة التلجرام');
                      }, 2000);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-black px-4 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                  >
                    {isArabic ? 'انضمام' : 'Join'}
                  </button>
                )}
              </div>
            </div>
`;

// Extract state usage
if (!modalCode.includes('hasJoinedTelegram')) {
  modalCode = modalCode.replace(
    /const {\s*coins,\s*buyPointsVipPass,\s*isVipActive,\s*streakDays,\s*lastDailyReward,\s*claimDailyReward\s*}/, 
    'const { coins, buyPointsVipPass, isVipActive, streakDays, lastDailyReward, claimDailyReward, hasJoinedTelegram, setJoinedTelegram }'
  );
  
  const searchString = '{/* Telegram Home Screen Task */}';
  modalCode = modalCode.replace(searchString, telegramTaskBlock + '\n\n            ' + searchString);
  
  fs.writeFileSync('src/components/PointsStoreModal.tsx', modalCode);
  console.log('patched modal');
} else {
  console.log('already patched');
}

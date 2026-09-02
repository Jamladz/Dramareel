const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const insertPoint = `          return (
            <div 
              key={ep.id} 
              data-episode-id={ep.id}
              className="reel-item relative w-full h-full snap-start snap-always touch-pan-y"
            >`;

const promptOverlay = `
                {/* 5-Min Ad Prompt for Long Episodes */}
                <AnimatePresence>
                  {isCurrentActive && isLongEpisodeAdPlaying && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
                    >
                      <div className="bg-[#111] border border-white/10 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
                          <Tv size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">
                          {isArabic ? 'فاصل إعلاني' : 'Ad Break'}
                        </h3>
                        <p className="text-sm text-white/60 mb-6 leading-relaxed">
                          {isArabic 
                            ? 'لمواصلة المشاهدة مجاناً، يرجى مشاهدة إعلان قصير' 
                            : 'To continue watching for free, please watch a short ad'}
                        </p>
                        <button
                          disabled={isAdLoading}
                          onClick={async () => {
                            setIsAdLoading(true);
                            const success = await showAdsgramAd(ADSGRAM_BLOCKS.LONG_EPISODE_AD);
                            setIsAdLoading(false);
                            // Even if Adsgram is skipped/fails, we let them continue for this milestone
                            setIsLongEpisodeAdPlaying(false);
                          }}
                          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-black active:scale-95 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                        >
                          {isAdLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                          <span>{isArabic ? 'شاهد الإعلان وأكمل' : 'Watch Ad & Continue'}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
`;

if (code.includes(insertPoint)) {
  code = code.replace(insertPoint, insertPoint + promptOverlay);
  fs.writeFileSync('src/pages/Watch.tsx', code);
  console.log('patched Watch.tsx with custom ad prompt');
} else {
  console.log('insertPoint not found');
}

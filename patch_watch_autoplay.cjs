const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Update state definition
code = code.replace(
  "const [autoPlayingNext, setAutoPlayingNext] = useState<{ id: string; nextEpNum: number } | null>(null);",
  "const [autoPlayingNext, setAutoPlayingNext] = useState<{ id: string; nextEpNum: number; nextEpId: string } | null>(null);"
);

// Update onComplete logic
const oldOnComplete = `                    if (idx + 1 < episodes.length) {
                      const nextEp = episodes[idx + 1];
                      const nextLocked = !isPaidVip() && !isPointsVip() && nextEp.episodeNumber > 6 && !unlockedEpisodes.includes(nextEp.id);

                      if (nextLocked) {
                        setShowUnlockModal(nextEp.id);
                      } else {
                        setAutoPlayingNext({ id: nextEp.id, nextEpNum: nextEp.episodeNumber });
                        
                        setTimeout(() => {
                          const nextEl = document.querySelector(\`[data-episode-id="\${nextEp.id}"]\`);
                          if (nextEl) {
                            nextEl.scrollIntoView({ behavior: 'smooth' });
                          }
                          setAutoPlayingNext(null);
                        }, 2000);
                      }
                    }`;

const newOnComplete = `                    if (idx + 1 < episodes.length) {
                      const nextEp = episodes[idx + 1];
                      // Use the same logic for nextLocked that we updated before (check if it's a long episode too)
                      const isNextLong = nextEp.isLongEpisode || (nextEp.duration && nextEp.duration >= 1200);
                      const nextLocked = !isPaidVip() && !isPointsVip() && nextEp.episodeNumber > 6 && !unlockedEpisodes.includes(nextEp.id) && !isNextLong;

                      if (nextLocked) {
                        setShowUnlockModal(nextEp.id);
                      } else {
                        // Display the overlay on the CURRENT episode (ep.id)
                        setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber, nextEpId: nextEp.id });
                        
                        // We set a slightly longer timeout (e.g. 4 seconds) so the user has a chance to read it
                        setTimeout(() => {
                          // Check if autoPlayingNext is still active (not cancelled)
                          setAutoPlayingNext(prev => {
                            if (prev && prev.id === ep.id) {
                              const nextEl = document.querySelector(\`[data-episode-id="\${nextEp.id}"]\`);
                              if (nextEl) {
                                nextEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }
                            return null;
                          });
                        }, 4000);
                      }
                    }`;
code = code.replace(oldOnComplete, newOnComplete);

// Update overlay rendering
const oldOverlay = `              {/* Auto Play Next Overlay */}
              {autoPlayingNext?.id === ep.id && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.3)] border border-white/10">
                    <Loader2 size={40} className="animate-spin text-red-600" />
                  </div>
                  <h3 className="text-2xl font-black text-white drop-shadow-lg mb-2">
                    {isArabic ? 'الحلقة القادمة...' : 'Up Next...'}
                  </h3>
                  <div className="bg-red-600/20 border border-red-600/50 px-5 py-1.5 rounded-full backdrop-blur-md">
                    <p className="text-red-400 font-bold text-sm">
                      {isArabic ? \`تشغيل حلقة \${autoPlayingNext.nextEpNum}\` : \`Playing Episode \${autoPlayingNext.nextEpNum}\`}
                    </p>
                  </div>
                </div>
              )}`;

const newOverlay = `              {/* Auto Play Next Overlay */}
              <AnimatePresence>
                {autoPlayingNext?.id === ep.id && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                  >
                    <div className="flex flex-col items-center">
                      <h3 className="text-2xl font-black text-white mb-2 drop-shadow-lg">
                        {isArabic ? 'الحلقة القادمة' : 'Up Next'}
                      </h3>
                      <p className="text-red-400 font-bold text-lg mb-8">
                        {isArabic ? \`حلقة \${autoPlayingNext.nextEpNum}\` : \`Episode \${autoPlayingNext.nextEpNum}\`}
                      </p>
                      
                      <div className="relative w-20 h-20 mb-8 cursor-pointer group" onClick={() => {
                        const nextEl = document.querySelector(\`[data-episode-id="\${autoPlayingNext.nextEpId}"]\`);
                        if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
                        setAutoPlayingNext(null);
                      }}>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="38" className="stroke-white/20" strokeWidth="4" fill="none" />
                          <circle cx="40" cy="40" r="38" className="stroke-red-600" strokeWidth="4" fill="none" strokeDasharray="238" strokeDashoffset="238" style={{ animation: 'countdown 4s linear forwards' }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full group-hover:bg-red-600/20 transition-colors">
                          <Play size={32} className="text-white ml-2" fill="currentColor" />
                        </div>
                      </div>

                      <button 
                        onClick={() => setAutoPlayingNext(null)}
                        className="text-white/50 hover:text-white text-sm font-bold tracking-wider uppercase transition-colors"
                      >
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>`;

code = code.replace(oldOverlay, newOverlay);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched auto play overlay');

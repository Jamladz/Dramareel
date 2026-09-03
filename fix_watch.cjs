const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const overlayStart = `{/* Auto Play Next Overlay */}`;
const overlayEnd = `              {/* Right Side Action Buttons */}`;
const overlayIndex = code.indexOf(overlayStart);
const overlayEndIndex = code.indexOf(overlayEnd, overlayIndex);

if (overlayIndex !== -1 && overlayEndIndex !== -1) {
  const newOverlay = `{/* Auto Play Next Overlay */}
              <AnimatePresence>
                {autoPlayingNext?.id === ep.id && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto"
                  >
                    <div className="flex flex-col items-center pointer-events-auto">
                      <h3 className="text-2xl font-black text-white mb-2 drop-shadow-lg">
                        {isArabic ? 'الحلقة القادمة' : 'Up Next'}
                      </h3>
                      <p className="text-red-400 font-bold text-lg mb-8">
                        {isArabic ? \`حلقة \${autoPlayingNext.nextEpNum}\` : \`Episode \${autoPlayingNext.nextEpNum}\`}
                      </p>
                      
                      <div className="relative w-20 h-20 mb-8 cursor-pointer group" onClick={() => {
                        scrollToEpisode(autoPlayingNext.nextEpId);
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
              </AnimatePresence>
`;
  code = code.substring(0, overlayIndex) + newOverlay + code.substring(overlayEndIndex);
}

const onCompleteStart = `setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber });`;
const onCompleteEnd = `}, 2500);`;
const ocIndex = code.indexOf(onCompleteStart);
const ocEndIndex = code.indexOf(onCompleteEnd, ocIndex);

if (ocIndex !== -1 && ocEndIndex !== -1) {
  const newOnComplete = `setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber, nextEpId: nextEp.id });
                        
                        setTimeout(() => {
                          setAutoPlayingNext(prev => {
                            if (prev && prev.id === ep.id) {
                              scrollToEpisode(nextEp.id);
                            }
                            return null;
                          });
                        }, 4000);`;
  code = code.substring(0, ocIndex) + newOnComplete + code.substring(ocEndIndex + onCompleteEnd.length);
}

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched successfully');

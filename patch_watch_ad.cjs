const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetAd = `                          onClick={async () => {
                            setIsAdLoading(true);
                            const success = await showAdsgramAd(ADSGRAM_BLOCKS.LONG_EPISODE_AD);
                            setIsAdLoading(false);
                            // Even if Adsgram is skipped/fails, we let them continue for this milestone
                            setIsLongEpisodeAdPlaying(false);
                          }}`;

const newAd = `                          onClick={async () => {
                            // Capture session before async ad
                            const adGeneration = playerSessionRef.current.generation;
                            
                            setIsAdLoading(true);
                            const success = await showAdsgramAd(ADSGRAM_BLOCKS.LONG_EPISODE_AD);
                            
                            // Check if component unmounted or session changed
                            if (isCurrentSession(ep.id, adGeneration)) {
                              setIsAdLoading(false);
                              // Even if Adsgram is skipped/fails, we let them continue for this milestone
                              setIsLongEpisodeAdPlaying(false);
                            }
                          }}`;

code = code.replace(targetAd, newAd);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched adsgram in watch');

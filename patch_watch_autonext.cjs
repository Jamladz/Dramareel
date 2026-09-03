const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetAutoNext = `                      if (nextLocked) {
                        setShowUnlockModal(nextEp.id);
                      } else {
                        setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber, nextEpId: nextEp.id });
                        
                        if (autoPlayNextRef.current) clearTimeout(autoPlayNextRef.current);
                        autoPlayNextRef.current = setTimeout(() => {
                          setAutoPlayingNext(null);
                          // Only transition if the user hasn't scrolled away during the countdown
                          if (activeEpisodeIdRef.current === ep.id) {
                            scrollToEpisode(nextEp.id, true);
                          }
                        }, 4000);
                      }`;

const newAutoNext = `                      if (nextLocked) {
                        setShowUnlockModal(nextEp.id);
                      } else {
                        setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber, nextEpId: nextEp.id });
                        
                        if (autoPlayNextRef.current) clearTimeout(autoPlayNextRef.current);
                        
                        // Capture current generation for safe comparison
                        const autoNextGeneration = playerSessionRef.current.generation;
                        
                        autoPlayNextRef.current = setTimeout(() => {
                          setAutoPlayingNext(null);
                          // STRICT SESSION VALIDATION
                          if (isCurrentSession(ep.id, autoNextGeneration)) {
                            switchToEpisode(nextEp.id, true);
                          }
                        }, 4000);
                      }`;

code = code.replace(targetAutoNext, newAutoNext);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched autonext');

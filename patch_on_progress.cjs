const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const target = `                  onProgress={(time) => {
                    if (isCurrentActive && (ep.isLongEpisode || (ep.duration && ep.duration >= 1200)) && !isPaidVip() && !isPointsVip()) {
                      const currentMilestone = Math.floor(time / 300);
                      if (currentMilestone > 0 && currentMilestone > lastAdMilestoneRef.current && !isLongEpisodeAdPlaying) {
                        lastAdMilestoneRef.current = currentMilestone;
                        setIsLongEpisodeAdPlaying(true);
                      }
                    }
                  }}`;

const replacement = `                  onProgress={(time) => {
                    const isNearEnd = ep.duration ? (ep.duration - time < 15) : false;
                    if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (ep.duration && ep.duration >= 1200)) && !isPaidVip() && !isPointsVip()) {
                      const currentMilestone = Math.floor(time / 300);
                      if (currentMilestone > 0 && currentMilestone > lastAdMilestoneRef.current && !isLongEpisodeAdPlaying) {
                        lastAdMilestoneRef.current = currentMilestone;
                        setIsLongEpisodeAdPlaying(true);
                      }
                    }
                  }}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched onProgress logic');

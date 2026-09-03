const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const target = `const nextEp = episodes[idx + 1];
                      const nextLocked = !isPaidVip() && !isPointsVip() && nextEp.episodeNumber > 6 && !unlockedEpisodes.includes(nextEp.id);`;
                      
const replacement = `const nextEp = episodes[idx + 1];
                      const isNextLong = nextEp.isLongEpisode || (nextEp.duration && nextEp.duration >= 1200);
                      const nextLocked = !isPaidVip() && !isPointsVip() && nextEp.episodeNumber > 6 && !unlockedEpisodes.includes(nextEp.id) && !isNextLong;`;
                      
code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched nextLocked logic');

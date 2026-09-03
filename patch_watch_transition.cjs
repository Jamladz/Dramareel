const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Fix 1: Update onProgress to use finalDuration
code = code.replace(
  `if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (ep.duration && ep.duration >= 1200)) && !isPaidVip() && !isPointsVip()) {`,
  `if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (finalDuration && finalDuration >= 1200)) && !isPaidVip() && !isPointsVip()) {`
);

// Fix 2: Improve scrollToEpisode transition (always set active immediately)
code = code.replace(
  `  const scrollToEpisode = (epId: string, smoothAdjacent = false) => {
    if (!smoothAdjacent) {
      setActiveEpisodeId(epId);
    }
    if (containerRef.current) {`,
  `  const scrollToEpisode = (epId: string, smoothAdjacent = false) => {
    // ALWAYS set active immediately for smooth audio transition
    setActiveEpisodeId(epId);
    if (containerRef.current) {`
);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx for transition and long episode ad');

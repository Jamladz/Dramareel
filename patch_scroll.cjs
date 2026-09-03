const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Replace scrollToEpisode definition
const oldScroll = `  const scrollToEpisode = (epId: string) => {
    setActiveEpisodeId(epId);
    if (containerRef.current) {
      const el = containerRef.current.querySelector(\`[data-episode-id="\${epId}"]\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };`;
const newScroll = `  const scrollToEpisode = (epId: string, smoothAdjacent = false) => {
    if (!smoothAdjacent) {
      setActiveEpisodeId(epId);
    }
    if (containerRef.current) {
      const el = containerRef.current.querySelector(\`[data-episode-id="\${epId}"]\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };`;
code = code.replace(oldScroll, newScroll);

// Replace auto play scroll calls
const oldAutoScroll = `if (activeEpisodeIdRef.current === ep.id) {
                            scrollToEpisode(nextEp.id);
                          }`;
const newAutoScroll = `if (activeEpisodeIdRef.current === ep.id) {
                            scrollToEpisode(nextEp.id, true);
                          }`;
code = code.replace(oldAutoScroll, newAutoScroll);

const oldManualScroll = `scrollToEpisode(autoPlayingNext.nextEpId);
                        setAutoPlayingNext(null);`;
const newManualScroll = `scrollToEpisode(autoPlayingNext.nextEpId, true);
                        setAutoPlayingNext(null);`;
code = code.replace(oldManualScroll, newManualScroll);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx for smooth adjacent scrolling');

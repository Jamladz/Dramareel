const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// 1. Add refs for activeEpisodeId and timer
const stateBlock = `  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');`;
const newStateBlock = `  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');
  const activeEpisodeIdRef = useRef<string>(activeEpisodeId);
  const autoPlayNextRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    activeEpisodeIdRef.current = activeEpisodeId;
  }, [activeEpisodeId]);`;
code = code.replace(stateBlock, newStateBlock);

// 2. Update the activeEpisodeId useEffect to clear autoplay
const effectBlock = `  useEffect(() => {
    lastAdMilestoneRef.current = 0;
  }, [activeEpisodeId]);`;
const newEffectBlock = `  useEffect(() => {
    lastAdMilestoneRef.current = 0;
    setAutoPlayingNext(prev => {
      if (prev && prev.id !== activeEpisodeId) {
        if (autoPlayNextRef.current) clearTimeout(autoPlayNextRef.current);
        return null;
      }
      return prev;
    });
  }, [activeEpisodeId]);`;
code = code.replace(effectBlock, newEffectBlock);

// 3. Update the onComplete logic
const ocStart = `setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber, nextEpId: nextEp.id });`;
const ocEnd = `}, 4000);`;
const ocStartIndex = code.indexOf(ocStart);
const ocEndIndex = code.indexOf(ocEnd, ocStartIndex);

if (ocStartIndex !== -1 && ocEndIndex !== -1) {
  const newOc = `setAutoPlayingNext({ id: ep.id, nextEpNum: nextEp.episodeNumber, nextEpId: nextEp.id });
                        
                        if (autoPlayNextRef.current) clearTimeout(autoPlayNextRef.current);
                        autoPlayNextRef.current = setTimeout(() => {
                          setAutoPlayingNext(null);
                          // Only transition if the user hasn't scrolled away during the countdown
                          if (activeEpisodeIdRef.current === ep.id) {
                            scrollToEpisode(nextEp.id);
                          }
                        }, 4000);`;
  code = code.substring(0, ocStartIndex) + newOc + code.substring(ocEndIndex + ocEnd.length);
}

// 4. Update the manual cancel to also clear timeout
const oldCancel = `onClick={() => setAutoPlayingNext(null)}`;
const newCancel = `onClick={() => {
                          if (autoPlayNextRef.current) clearTimeout(autoPlayNextRef.current);
                          setAutoPlayingNext(null);
                        }}`;
code = code.replace(oldCancel, newCancel);

// 5. Update the manual play circle click to also clear timeout
const oldCircleClick = `onClick={() => {
                        scrollToEpisode(autoPlayingNext.nextEpId);
                        setAutoPlayingNext(null);
                      }}`;
const newCircleClick = `onClick={() => {
                        if (autoPlayNextRef.current) clearTimeout(autoPlayNextRef.current);
                        scrollToEpisode(autoPlayingNext.nextEpId);
                        setAutoPlayingNext(null);
                      }}`;
code = code.replace(oldCircleClick, newCircleClick);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// 1. Add playerSession to Watch
code = code.replace('const [activeEpisodeId, setActiveEpisodeId] = useState<string>(\'\');', 
`const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');
  const playerSessionRef = useRef({ episodeId: '', generation: 0, triggeredMilestones: new Set<number>() });
  const isCurrentSession = (epId: string, gen: number) => {
    return playerSessionRef.current.episodeId === epId && playerSessionRef.current.generation === gen;
  };
`);

// 2. Refactor switchToEpisode
const targetScrollToEpisode = `  // Scroll to active episode on initial load or drawer click
  const scrollToEpisode = (epId: string, smoothAdjacent = false) => {
    isProgrammaticScrollRef.current = true;
    setActiveEpisodeId(epId);
    if (containerRef.current) {
      const el = containerRef.current.querySelector(\`[data-episode-id="\${epId}"]\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);
  };`;

const newScrollToEpisode = `  // Scroll to active episode on initial load or drawer click
  const switchToEpisode = (epId: string, smoothAdjacent = false) => {
    isProgrammaticScrollRef.current = true;
    
    // STRICT SINGLE PLAYER LIFECYCLE
    if (playerSessionRef.current.episodeId !== epId) {
      playerSessionRef.current = {
        episodeId: epId,
        generation: playerSessionRef.current.generation + 1,
        triggeredMilestones: new Set<number>()
      };
    }
    
    setActiveEpisodeId(epId);
    
    if (containerRef.current) {
      const el = containerRef.current.querySelector(\`[data-episode-id="\${epId}"]\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);
  };
  
  const scrollToEpisode = switchToEpisode; // Alias
  `;

code = code.replace(targetScrollToEpisode, newScrollToEpisode);

// 3. Fix IntersectionObserver to use switchToEpisode without the scrolling part if already scrolling natively
const ioRegex = /if \(bestEpId\) \{\s*setActiveEpisodeId\(bestEpId\);\s*\}/;
code = code.replace(ioRegex, `if (bestEpId && bestEpId !== playerSessionRef.current.episodeId) {
          playerSessionRef.current = {
            episodeId: bestEpId,
            generation: playerSessionRef.current.generation + 1,
            triggeredMilestones: new Set<number>()
          };
          setActiveEpisodeId(bestEpId);
        }`);

// 4. Update the onProgress milestone logic
const targetMilestone = `                    if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (finalDuration && finalDuration >= 360)) && !isPaidVip() && !isPointsVip()) {
                      const currentMilestone = Math.floor(time / 300);
                      if (currentMilestone > 0 && currentMilestone > lastAdMilestoneRef.current && !isLongEpisodeAdPlaying) {
                        lastAdMilestoneRef.current = currentMilestone;
                        setIsLongEpisodeAdPlaying(true);
                      }
                    }`;

const newMilestone = `                    // 5-MINUTE AD MILESTONE LOGIC WITH SESSION VALIDATION
                    if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (finalDuration && finalDuration >= 360)) && !isPaidVip() && !isPointsVip()) {
                      const currentMilestone = Math.floor(time / 300);
                      
                      // Check crossing properly and avoid duplicate triggers
                      if (currentMilestone > 0 && !playerSessionRef.current.triggeredMilestones.has(currentMilestone) && !isLongEpisodeAdPlaying) {
                        playerSessionRef.current.triggeredMilestones.add(currentMilestone);
                        setIsLongEpisodeAdPlaying(true);
                      }
                    }`;

code = code.replace(targetMilestone, newMilestone);

// 5. Inject currentSession info into ReelPlayer props
const targetReelPlayer = `<ReelPlayer \n                   url={ep.videoUrl} \n                   isActive={isCurrentActive}`;
const newReelPlayer = `<ReelPlayer \n                   url={ep.videoUrl} \n                   isActive={isCurrentActive}\n                   playerSessionId={isCurrentActive ? playerSessionRef.current.generation : -1}`;
code = code.replace(targetReelPlayer, newReelPlayer);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched watch architecture');

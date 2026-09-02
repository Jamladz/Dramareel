const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// 1. Add states
const stateTarget = `  const [watchedVideosCount, setWatchedVideosCount] = useState(0);`;
const newStates = `  const [watchedVideosCount, setWatchedVideosCount] = useState(0);
  const [isLongEpisodeAdPlaying, setIsLongEpisodeAdPlaying] = useState(false);
  const lastAdMilestoneRef = useRef<number>(0);

  useEffect(() => {
    lastAdMilestoneRef.current = 0;
  }, [activeEpisodeId]);`;

code = code.replace(stateTarget, newStates);

// 2. Update ReelPlayer implementation
const reelPlayerTarget = `<ReelPlayer 
                  url={ep.videoUrl} 
                  isActive={isCurrentActive}
                  shouldLoad={isNearActive}
                  duration={ep.duration}
                  isUIVisible={areControlsVisible}
                  onComplete={() => {`;

const newReelPlayer = `<ReelPlayer 
                  url={ep.videoUrl} 
                  isActive={isCurrentActive}
                  forcePause={isCurrentActive && isLongEpisodeAdPlaying}
                  shouldLoad={isNearActive}
                  duration={ep.duration}
                  isUIVisible={areControlsVisible}
                  onProgress={(time) => {
                    if (isCurrentActive && ep.isLongEpisode && !isPaidVip() && !isPointsVip()) {
                      const currentMilestone = Math.floor(time / 300);
                      if (currentMilestone > 0 && currentMilestone > lastAdMilestoneRef.current && !isLongEpisodeAdPlaying) {
                        lastAdMilestoneRef.current = currentMilestone;
                        setIsLongEpisodeAdPlaying(true);
                        showAdsgramAd(ADSGRAM_BLOCKS.LONG_EPISODE_AD).finally(() => {
                           setIsLongEpisodeAdPlaying(false);
                        });
                      }
                    }
                  }}
                  onComplete={() => {`;

code = code.replace(reelPlayerTarget, newReelPlayer);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx');

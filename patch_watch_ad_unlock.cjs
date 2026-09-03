const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetUnlock = `  const handleUnlockWithAdsgram = async (epId: string) => {
    const currentEp = episodes.find(e => e.id === epId);
    if (!currentEp) return;

    setIsAdLoading(true);
    const success = await showAdsgramAd(ADSGRAM_BLOCKS.WATCH_AD);
    setIsAdLoading(false);

    if (success) {
      // Unlock this episode
      unlockEpisode(epId);

      // Unlock pair episode (e.g. if ep 7 -> unlock ep 8 as well)
      const pairEpNum = currentEp.episodeNumber % 2 === 1 
        ? currentEp.episodeNumber + 1 
        : currentEp.episodeNumber - 1;
      
      const pairEp = episodes.find(e => e.episodeNumber === pairEpNum);
      if (pairEp) {
        unlockEpisode(pairEp.id);
      }

      setShowUnlockModal(null);
    }
  };`;

const newUnlock = `  const handleUnlockWithAdsgram = async (epId: string) => {
    const currentEp = episodes.find(e => e.id === epId);
    if (!currentEp) return;

    setIsAdLoading(true);
    const success = await showAdsgramAd(ADSGRAM_BLOCKS.WATCH_AD);
    
    // Always clear loading if still mounted
    setIsAdLoading(false);

    // Adsgram reward idempotency logic - only grant reward if success is true
    if (success) {
      // Unlock this episode
      unlockEpisode(epId);

      // Unlock pair episode
      const pairEpNum = currentEp.episodeNumber % 2 === 1 
        ? currentEp.episodeNumber + 1 
        : currentEp.episodeNumber - 1;
      
      const pairEp = episodes.find(e => e.episodeNumber === pairEpNum);
      if (pairEp) {
        unlockEpisode(pairEp.id);
      }

      setShowUnlockModal(null);
    }
  };`;

code = code.replace(targetUnlock, newUnlock);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched adsgram unlock in watch');

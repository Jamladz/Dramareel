const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

// 1. Sync isActiveRef update
code = code.replace(
  `  const isActiveRef = useRef(isActive);`,
  `  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive; // Sync update during render`
);

// Remove the old async useEffect update for isActiveRef to prevent race conditions
const oldUseEffect = `  // Synchronously update isActiveRef & reset state on inactive
  useEffect(() => {
    isActiveRef.current = isActive;
    const video = videoRef.current;
    
    if (!isActive) {
      onCompleteCalledRef.current = false;
      if (video) {
        try {
          video.pause();
        } catch (e) {}
        setIsPlaying(false);
      }
    } else {
      onCompleteCalledRef.current = false;
    }
  }, [isActive]);`;
  
code = code.replace(oldUseEffect, `  // Sync pause on inactive
  useEffect(() => {
    const video = videoRef.current;
    if (!isActive) {
      onCompleteCalledRef.current = false;
      if (video) {
        try { video.pause(); } catch (e) {}
        setIsPlaying(false);
      }
    } else {
      onCompleteCalledRef.current = false;
    }
  }, [isActive]);`);

// 2. Robust playback effect with cleanup cancellation
const oldPlaybackEffect = `  // Master Playback Trigger based on isActive and isReady
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && isReady) {
      // Unmute & attempt playback
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Check if user swiped away while play promise was fulfilling
            if (!isActiveRef.current) {
              video.pause();
              setIsPlaying(false);
            } else {
              setIsPlaying(true);
              setIsBuffering(false);
            }
          })
          .catch((err) => {
            console.warn('Playback prevented:', err);
            setIsPlaying(false);
          });
      }
    } else {
      // Immediately stop & pause
      video.pause();
      setIsPlaying(false);
      try {
      } catch (e) {}
    }
  }, [isActive, isReady, isMuted]);`;

const newPlaybackEffect = `  // Master Playback Trigger based on isActive and isReady
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isCancelled = false;

    if (isActive && isReady) {
      video.muted = isMuted;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isCancelled || !isActiveRef.current) {
              video.pause();
              setIsPlaying(false);
            } else {
              setIsPlaying(true);
              setIsBuffering(false);
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Playback prevented:', err);
            }
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }

    return () => {
      isCancelled = true;
      if (!isActiveRef.current) {
        try { video.pause(); } catch(e) {}
      }
    };
  }, [isActive, isReady, isMuted]);`;

code = code.replace(oldPlaybackEffect, newPlaybackEffect);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer playback logic');

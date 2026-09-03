const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

const targetTimeUpdate = `  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.duration) {
      const targetDuration = video.duration;
      const pct = Math.min(100, (video.currentTime / targetDuration) * 100);
      setProgress(pct);
    }
    if (onProgress) {
      onProgress(video.currentTime, video.duration);
    }
  };`;

const newTimeUpdate = `  const handleTimeUpdate = () => {
    if (!isActiveRef.current || sessionRef.current !== playerSessionId) return; // Strict session check
    const video = videoRef.current;
    if (!video) return;

    if (video.duration) {
      const targetDuration = video.duration;
      const pct = Math.min(100, (video.currentTime / targetDuration) * 100);
      setProgress(pct);
    }
    if (onProgress) {
      onProgress(video.currentTime, video.duration);
    }
  };`;

code = code.replace(targetTimeUpdate, newTimeUpdate);

const targetOnEnded = `        onEnded={() => {
          setIsPlaying(false);
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            if (onComplete) onComplete();
          }
        }}`;

const newOnEnded = `        onEnded={() => {
          if (!isActiveRef.current || sessionRef.current !== playerSessionId) return; // Strict session check
          setIsPlaying(false);
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            if (onComplete) onComplete();
          }
        }}`;

code = code.replace(targetOnEnded, newOnEnded);

// Fix fallback timer for embeds to respect session validation
const targetFallbackTimer = `  // Fallback timer for embeds to report progress
  useEffect(() => {
    if (!parsed.embedUrl) return;
    if (!isActive) {
      setWatchedSeconds(0);
      return;
    }
    if (forcePause) return;

    const interval = setInterval(() => {
      setWatchedSeconds(prev => {
        const next = prev + 1;
        if (onProgress) onProgress(next, duration);
        
        // Pseudo-complete for embeds based on admin duration
        if (duration && next >= duration) {
          if (!onCompleteCalledRef.current && onComplete) {
            onCompleteCalledRef.current = true;
            onComplete();
          }
        }
        
        // Pseudo-progress bar update
        if (duration) {
          setProgress(Math.min(100, (next / duration) * 100));
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [parsed.embedUrl, isActive, forcePause, duration, onProgress, onComplete]);`;

const newFallbackTimer = `  // Fallback timer for embeds to report progress
  useEffect(() => {
    if (!parsed.embedUrl) return;
    if (!isActive) {
      setWatchedSeconds(0);
      return;
    }
    if (forcePause) return;

    const currentSessionAtMount = sessionRef.current;

    const interval = setInterval(() => {
      if (!isActiveRef.current || sessionRef.current !== currentSessionAtMount) return; // Strict session check
      
      setWatchedSeconds(prev => {
        const next = prev + 1;
        if (onProgress) onProgress(next, duration);
        
        if (duration && next >= duration) {
          if (!onCompleteCalledRef.current && onComplete) {
            onCompleteCalledRef.current = true;
            onComplete();
          }
        }
        
        if (duration) {
          setProgress(Math.min(100, (next / duration) * 100));
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [parsed.embedUrl, isActive, forcePause, duration, playerSessionId, onProgress, onComplete]);`;

code = code.replace(targetFallbackTimer, newFallbackTimer);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer events');

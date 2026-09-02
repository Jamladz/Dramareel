const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

const target = `  // Synchronously update isActiveRef & reset state on inactive
  useEffect(() => {
    isActiveRef.current = isActive;`;

const newCode = `  // Fallback timer for embeds to report progress
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
        if (onProgress) onProgress(next);
        
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
  }, [parsed.embedUrl, isActive, forcePause, duration, onProgress, onComplete]);

  // Synchronously update isActiveRef & reset state on inactive
  useEffect(() => {
    isActiveRef.current = isActive;`;

code = code.replace(target, newCode);
fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer.tsx embed progress');

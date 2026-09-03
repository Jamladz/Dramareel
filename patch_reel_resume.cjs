const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

const target = `  // Handle force pause
  useEffect(() => {
    if (forcePause && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [forcePause]);`;

const replacement = `  // Handle force pause
  useEffect(() => {
    if (forcePause && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else if (!forcePause && videoRef.current && isActive && isReady) {
      // Resume playing if forcePause is lifted
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [forcePause, isActive, isReady]);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer.tsx for resuming after ad');

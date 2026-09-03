const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

// Ensure useLayoutEffect is imported
if (!code.includes('useLayoutEffect')) {
  code = code.replace(/import React, \{([^}]+)\} from 'react';/, "import React, { $1, useLayoutEffect } from 'react';");
}

const targetSyncPause = `  // Sync pause on inactive
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
  }, [isActive]);`;

const replacementSyncPause = `  // Sync pause on inactive - useLayoutEffect fires before the browser paints
  useLayoutEffect(() => {
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
  }, [isActive]);`;

code = code.replace(targetSyncPause, replacementSyncPause);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer layout effect');

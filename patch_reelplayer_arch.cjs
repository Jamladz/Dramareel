const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

// 1. Add playerSessionId to props
code = code.replace(
  'interface ReelPlayerProps {',
  `interface ReelPlayerProps {
  playerSessionId?: number;`
);

code = code.replace(
  'export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, shouldLoad = true, duration, onProgress, onComplete, isUIVisible, forcePause }) => {',
  'export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, playerSessionId, shouldLoad = true, duration, onProgress, onComplete, isUIVisible, forcePause }) => {'
);

// 2. Add safeSession access
code = code.replace(
  '  const isActiveRef = useRef(isActive);',
  `  const isActiveRef = useRef(isActive);
  const sessionRef = useRef(playerSessionId);
  sessionRef.current = playerSessionId;`
);

// 3. Update the Master Playback Trigger to enforce session IDs and single source of truth
const targetPlaybackEffect = `  // Master Playback Trigger based on isActive and isReady
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

const newPlaybackEffect = `  // ROOT-LEVEL STRICT PLAYBACK CONTROLLER
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentSessionAtMount = sessionRef.current;
    let isCancelled = false;
    
    // Strict verification helper
    const isValid = () => {
      return !isCancelled && isActiveRef.current && sessionRef.current === currentSessionAtMount;
    };

    if (isActive && isReady && !forcePause) {
      video.muted = isMuted;
      
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Check generation/session immediately after async resolve
            if (!isValid()) {
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
      // Force stop unconditionally if not active or forced paused
      video.pause();
      setIsPlaying(false);
    }

    return () => {
      isCancelled = true;
      if (!isActiveRef.current) {
        try { video.pause(); } catch(e) {}
      }
    };
  }, [isActive, isReady, isMuted, forcePause, playerSessionId]);`;

code = code.replace(targetPlaybackEffect, newPlaybackEffect);

// 4. Update the iframe message listener with session check
const oldIframeEffect = /const handleMessage = \(e: MessageEvent\) => {[\s\S]*?window\.removeEventListener\('message', handleMessage\);\n    };\n  \}, \[isActive, parsed\.embedUrl, onProgress, onComplete, duration\]\);/;

const newIframeEffect = `const handleMessage = (e: MessageEvent) => {
      if (!isActiveRef.current || sessionRef.current !== playerSessionId) return; // Strict session check

      try {
        let data = e.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (_) {}
        }
        if (!data) return;

        if (data.event === 'onStateChange') {
          const state = data.info?.playerState ?? data.info;
          if (state === 1) setIframeState('playing');
          if (state === 2) setIframeState('paused');
          if (state === 3) setIframeState('buffering');
          if (state === 0) {
            if (!onCompleteCalledRef.current) {
              onCompleteCalledRef.current = true;
              if (onComplete && isActiveRef.current) onComplete();
            }
          }
        }
        
        if (data.event === 'infoDelivery' && data.info?.currentTime) {
          const time = data.info.currentTime;
          if (onProgress && isActiveRef.current) {
            onProgress(time, data.info.duration || duration);
          }
          if (data.info.duration) {
            setProgress(Math.min(100, (time / data.info.duration) * 100));
          }
        }
      } catch (err) {
        // Safe ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isActive, playerSessionId, parsed.embedUrl, onProgress, onComplete, duration]);`;

code = code.replace(oldIframeEffect, newIframeEffect);


fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer architecture');

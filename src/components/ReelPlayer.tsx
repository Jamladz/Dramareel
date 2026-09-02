import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Loader2, WifiOff, RotateCcw, RotateCw, FastForward } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';

interface ReelPlayerProps {
  url: string;
  forcePause?: boolean;
  isActive: boolean;
  shouldLoad?: boolean; // whether to load the video source (for lazy loading)
  duration?: number; // duration in seconds set by admin
  onProgress?: (time: number) => void;
  onComplete?: () => void;
  isUIVisible?: boolean;
}

export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, shouldLoad = true, duration, onProgress, onComplete, isUIVisible, forcePause }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isActiveRef = useRef(isActive);
  const onCompleteCalledRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [iframeState, setIframeState] = useState<'playing' | 'buffering' | 'paused'>('playing');
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);
  const [seekAnim, setSeekAnim] = useState<'forward' | 'rewind' | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number, side: 'left' | 'right' | 'center' }>({ time: 0, side: 'center' });
  const speedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSpeeding, setIsSpeeding] = useState(false);

  const parsed = parseVideoUrl(url, isActive);

  // Monitor online / offline network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle force pause
  useEffect(() => {
    if (forcePause && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [forcePause]);

  // Fallback timer for embeds to report progress
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
    isActiveRef.current = isActive;
    const video = videoRef.current;
    
    if (!isActive) {
      onCompleteCalledRef.current = false;
      if (video) {
        try {
          video.pause();
          video.currentTime = 0;
        } catch (e) {}
        setIsPlaying(false);
      }
    } else {
      onCompleteCalledRef.current = false;
    }
  }, [isActive]);

  useEffect(() => {
    if (parsed.embedUrl || !parsed.originalUrl || !shouldLoad) return;

    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video) return;

    setIsReady(false);
    setIsBuffering(true);

    if (parsed.type === 'hls') {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(parsed.originalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          setIsBuffering(false);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = parsed.originalUrl;
        const handleMetadata = () => {
          setIsReady(true);
          setIsBuffering(false);
        };
        video.addEventListener('loadedmetadata', handleMetadata);
        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
          video.removeAttribute('src');
          video.load();
        };
      }
    } else {
      video.src = parsed.originalUrl;
      const handleMetadata = () => {
        setIsReady(true);
        setIsBuffering(false);
      };
      video.addEventListener('loadedmetadata', handleMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleMetadata);
        video.removeAttribute('src');
        video.load();
      };
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [parsed.originalUrl, parsed.type, shouldLoad]);

  // Master Playback Trigger based on isActive and isReady
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
              video.currentTime = 0;
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
        video.currentTime = 0;
      } catch (e) {}
    }
  }, [isActive, isReady, isMuted]);

  // Handle player state & completion messages from embedded iframe players
  useEffect(() => {
    if (!isActive) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (_) {}
        }
        if (!data) return;

        // YouTube player states: 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
        if (data.event === 'onStateChange') {
          const state = data.info?.playerState ?? data.info;
          if (state === 1) setIframeState('playing');
          if (state === 2) setIframeState('paused');
          if (state === 3) setIframeState('buffering');
          if (state === 0) {
            if (!onCompleteCalledRef.current) {
              onCompleteCalledRef.current = true;
              if (onComplete) onComplete();
            }
          }
        }

        // Generic ended events
        if (data.event === 'ended' || data.event === 'video_end' || data.event === 'video_ended' || data === 'ended') {
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            if (onComplete) onComplete();
          }
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isActive, onComplete]);

  const togglePlay = () => {
    if (forcePause) return;
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowControlIcon('pause');
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setShowControlIcon('play');
      }).catch(() => setIsPlaying(false));
    }

    setTimeout(() => {
      setShowControlIcon(null);
    }, 600);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const video = videoRef.current;
    if (!video) return;

    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only left click

    // Start long press timer for 2x speed
    speedTimeoutRef.current = setTimeout(() => {
      video.playbackRate = 2.0;
      setIsSpeeding(true);
    }, 450); // 450ms long press threshold
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const video = videoRef.current;
    if (!video) return;

    if (speedTimeoutRef.current) {
      clearTimeout(speedTimeoutRef.current);
      speedTimeoutRef.current = null;
    }

    if (isSpeeding) {
      video.playbackRate = 1.0;
      setIsSpeeding(false);
      return; // If we were speeding, do not trigger tap logic
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    let side: 'left' | 'right' | 'center' = 'center';
    if (x < width * 0.35) side = 'left';
    else if (x > width * 0.65) side = 'right';

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current.time;
    const isDoubleTap = timeSinceLastTap < 300 && lastTapRef.current.side === side;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (isDoubleTap && side !== 'center') {
      if (side === 'right') {
        // Double Clicked Right -> Forward
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        setSeekAnim('forward');
        setTimeout(() => setSeekAnim(null), 600);
      } else if (side === 'left') {
        // Double Clicked Left -> Rewind
        video.currentTime = Math.max(0, video.currentTime - 10);
        setSeekAnim('rewind');
        setTimeout(() => setSeekAnim(null), 600);
      }
      lastTapRef.current = { time: 0, side: 'center' };
    } else {
      lastTapRef.current = { time: now, side };
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap anywhere -> Let it bubble up to toggle UI controls.
        tapTimeoutRef.current = null;
      }, 300);
    }
  };

  const handlePointerCancel = () => {
    const video = videoRef.current;
    if (!video) return;

    if (speedTimeoutRef.current) {
      clearTimeout(speedTimeoutRef.current);
      speedTimeoutRef.current = null;
    }

    if (isSpeeding) {
      video.playbackRate = 1.0;
      setIsSpeeding(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMute = !isMuted;
    video.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.duration) {
      const targetDuration = video.duration;
      const pct = Math.min(100, (video.currentTime / targetDuration) * 100);
      setProgress(pct);
    }
    if (onProgress) {
      onProgress(video.currentTime);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (parsed.embedUrl) {
    const isBufferingOrOffline = !isOnline || iframeState === 'buffering';

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {isActive ? (
          <div className="relative w-full h-full">
            <iframe
              src={parsed.embedUrl}
              className="w-full h-full border-none pointer-events-auto scale-[1.02]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title="Video Player"
            />

          {/* Top Controls Bar (Network Sensor) */}
          <div className="absolute top-[calc(5.5rem+var(--tg-safe-area-inset-top,env(safe-area-inset-top,0px)))] left-3.5 right-2 z-30 flex items-center justify-end pointer-events-none">
            {/* Right: Network Status indicator if offline / buffering */}
            {isBufferingOrOffline && (
              <div className="flex items-center gap-2 bg-black/80 text-amber-400 text-xs px-3.5 py-1.5 rounded-full border border-amber-500/40 shadow-xl backdrop-blur-xl animate-pulse pointer-events-auto">
                {!isOnline ? <WifiOff size={14} className="text-red-400" /> : <Loader2 size={14} className="animate-spin text-amber-400" />}
                <span className="font-bold text-[11px]">{!isOnline ? 'لا يوجد إنترنت' : 'جاري التحميل...'}</span>
              </div>
            )}
          </div>
          </div>
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center relative">
            {parsed.thumbnailUrl ? (
              <img
                src={parsed.thumbnailUrl}
                alt="Video Thumbnail"
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="text-white/40 text-xs font-mono uppercase tracking-widest">{parsed.type} Video</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <Play size={28} fill="white" className="ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isHtml5Buffering = !isOnline || isBuffering;

  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden" 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onStalled={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            if (onComplete) onComplete();
          }
        }}
        loop={false}
        playsInline
      />

      {/* Buffering or Network Slow Sensor */}
      {isHtml5Buffering && isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none z-20 gap-3 backdrop-blur-[2px]">
          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/30">
            {!isOnline ? <WifiOff size={24} /> : <Loader2 size={24} className="animate-spin text-red-500" />}
          </div>
          <span className="text-xs font-bold text-amber-300 bg-black/80 px-3 py-1 rounded-full border border-amber-500/20 shadow-md">
            {!isOnline ? 'انقطاع الاتصال بالإنترنت' : 'ضعف في الشبكة... جاري التحميل'}
          </span>
        </div>
      )}

      {/* Play/Pause Popup Anim */}
      {showControlIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-20 transition-all">
          <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md animate-ping">
            {showControlIcon === 'play' ? <Play size={28} fill="white" /> : <Pause size={28} fill="white" />}
          </div>
        </div>
      )}

      {/* Central Play/Pause Button */}
      {(isUIVisible || (!isPlaying && isReady)) && isActive && !showControlIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all active:scale-95 pointer-events-auto border ${!isPlaying ? 'bg-red-600/90 border-red-500/50 shadow-[0_0_30px_rgba(229,9,20,0.4)]' : 'bg-black/50 border-white/20'}`}
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-2" />}
          </button>
        </div>
      )}

      {/* Top Controls: Sound Toggle */}
      {isActive && (
        <div className="absolute top-[calc(5.5rem+var(--tg-safe-area-inset-top,env(safe-area-inset-top,0px)))] left-3.5 right-2 z-30 flex items-center justify-end pointer-events-none">
          <button
            onClick={toggleMute}
            className="w-10 h-10 bg-black/60 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-xl active:scale-90 hover:border-white/40 transition-all shadow-lg pointer-events-auto"
          >
            {isMuted ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} className="text-white" />}
          </button>
        </div>
      )}

      {/* Seek Animations (Rewind / Forward) */}
      <AnimatePresence>
        {seekAnim === 'forward' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute right-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-full w-24 h-24 pointer-events-none z-30"
          >
            <RotateCw size={36} className="text-white drop-shadow-md" />
            <span className="text-[11px] font-bold text-white mt-1.5 drop-shadow-md">+10s</span>
          </motion.div>
        )}
        {seekAnim === 'rewind' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-full w-24 h-24 pointer-events-none z-30"
          >
            <RotateCcw size={36} className="text-white drop-shadow-md" />
            <span className="text-[11px] font-bold text-white mt-1.5 drop-shadow-md">-10s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speeding 2x Animation */}
      <AnimatePresence>
        {isSpeeding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 pointer-events-none z-40 shadow-xl"
          >
            <FastForward size={18} className="text-white" fill="currentColor" />
            <span className="text-white font-extrabold text-sm tracking-widest drop-shadow-md">2x Speed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Progress Bar */}
      {isActive && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-red-600 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};


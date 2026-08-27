import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { cn } from '../lib/utils';
import { Play, Pause, Maximize, Settings, Volume2, VolumeX } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: number) => void;
  startAt?: number;
  className?: string;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onProgress, startAt = 0, className, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const parsed = parseVideoUrl(url, true);

  useEffect(() => {
    if (parsed.embedUrl || !parsed.originalUrl) return;

    let hls: Hls;
    const video = videoRef.current;
    if (!video) return;

    if (parsed.type === 'hls') {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(parsed.originalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (startAt > 0) {
            video.currentTime = startAt;
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = parsed.originalUrl;
        if (startAt > 0) {
          video.addEventListener('loadedmetadata', () => {
            video.currentTime = startAt;
          });
        }
      }
    } else {
      video.src = parsed.originalUrl;
      if (startAt > 0) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = startAt;
        });
      }
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [parsed.originalUrl, parsed.type, parsed.embedUrl, startAt]);

  if (parsed.embedUrl) {
    return (
      <div className={cn("relative bg-black rounded-2xl overflow-hidden w-full aspect-video shadow-2xl border border-white/10", className)}>
        <iframe
          src={parsed.embedUrl}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Video Player"
        />
      </div>
    );
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onProgress) {
        onProgress(videoRef.current.currentTime);
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => console.error(err));
      } else {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative group bg-black rounded-lg overflow-hidden", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />
      
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
        showControls || !isPlaying ? "opacity-100" : "opacity-0"
      )} onClick={e => e.stopPropagation()}>
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          if (videoRef.current) videoRef.current.currentTime = pos * duration;
        }}>
          <div 
            className="h-full bg-red-600 rounded-full" 
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-red-500 transition">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }} className="hover:text-red-500 transition">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button className="hover:text-red-500 transition">
              <Settings size={20} />
            </button>
            <button onClick={toggleFullscreen} className="hover:text-red-500 transition">
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

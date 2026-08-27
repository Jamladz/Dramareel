import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Share2, MessageCircle, Bookmark, PlayCircle, Plus, Zap, Sparkles, Crown, Tv, Gift } from 'lucide-react';
import { useAppStore } from '../store';
import { AnimatedViews } from '../components/AnimatedViews';
import { ReelPlayer } from '../components/ReelPlayer';
import { TonPaymentModal } from '../components/TonPaymentModal';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';
import { Movie } from '../types';

export const ForYou = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, toggleFavorite, favorites, unlockedEpisodes, spendCoins, unlockEpisode, coins, isVipActive, updateHistory } = useAppStore();
  const isVip = isVipActive();
  
  const [showUnlockModal, setShowUnlockModal] = useState<string | null>(null);
  const [showTonModal, setShowTonModal] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleUnlockWithAdsgram = async (epId: string) => {
    setIsAdLoading(true);
    const success = await showAdsgramAd(ADSGRAM_BLOCKS.EPISODE_REWARD);
    setIsAdLoading(false);

    if (success) {
      unlockEpisode(epId);

      // Try to unlock pair episode in the feed if found
      const currentItem = allEpisodes.find(item => item.episode.id === epId);
      if (currentItem) {
        const currentEp = currentItem.episode;
        const pairEpNum = currentEp.episodeNumber % 2 === 1 
          ? currentEp.episodeNumber + 1 
          : currentEp.episodeNumber - 1;
        
        const pairItem = allEpisodes.find(
          item => item.movie.id === currentItem.movie.id && item.episode.episodeNumber === pairEpNum
        );
        if (pairItem) {
          unlockEpisode(pairItem.episode.id);
        }
      }

      setShowUnlockModal(null);
    }
  };

  // Auto-hiding controls timer (4 seconds of no touch)
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = () => {
    setAreControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setAreControlsVisible(false);
    }, 4000);
  };

  const handleScreenTouch = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.pointer-events-auto')) {
      resetControlsTimer();
      return;
    }
    setAreControlsVisible(prev => {
      const next = !prev;
      if (next) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setAreControlsVisible(false), 4000);
      } else {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      }
      return next;
    });
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Combine all episodes from all movies
  const allEpisodes = useMemo(() => {
    let feed: { movie: Movie, episode: any }[] = [];
    movies.forEach(movie => {
      if (movie.episodes && movie.episodes.length > 0) {
        movie.episodes.forEach(ep => {
          feed.push({ movie, episode: ep });
        });
      } else {
        feed.push({ movie, episode: {
          id: movie.id,
          episodeNumber: 1,
          title: movie.title,
          videoUrl: movie.videoUrl || ''
        }});
      }
    });
    // Randomize feed (a stable shuffle could be used, but simple random for now)
    return feed.sort(() => Math.random() - 0.5);
  }, [movies]);

  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const scrollToNext = (nextIndex: number) => {
    if (nextIndex < allEpisodes.length && containerRef.current) {
      const nextItem = allEpisodes[nextIndex];
      if (nextItem) {
        setActiveEpisodeId(nextItem.episode.id);
        const children = containerRef.current.querySelectorAll('.reel-item');
        if (children[nextIndex]) {
          children[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const height = container.clientHeight;
    if (height <= 0) return;
    const index = Math.round(container.scrollTop / height);
    if (allEpisodes[index] && allEpisodes[index].episode.id !== activeEpisodeId) {
      setActiveEpisodeId(allEpisodes[index].episode.id);
    }
  };

  useEffect(() => {
    if (allEpisodes.length > 0 && !activeEpisodeId) {
      setActiveEpisodeId(allEpisodes[0].episode.id);
    }
  }, [allEpisodes, activeEpisodeId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const epId = entry.target.getAttribute('data-episode-id');
            if (epId) setActiveEpisodeId(epId);
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const children = container.querySelectorAll('.reel-item');
    children.forEach((child) => observer.current?.observe(child));

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [allEpisodes]);

  // Sync Watch History when user scrolls to an episode in ForYou feed
  useEffect(() => {
    if (activeEpisodeId && allEpisodes.length > 0) {
      const currentItem = allEpisodes.find(item => item.episode.id === activeEpisodeId);
      if (currentItem) {
        const { movie, episode } = currentItem;
        const totalEps = movie.episodes?.length || 1;
        const pct = Math.min(100, Math.round((episode.episodeNumber / totalEps) * 100));
        updateHistory(movie.id, {
          movieId: movie.id,
          episodeId: episode.id,
          episodeNumber: episode.episodeNumber,
          lastWatchedMinute: episode.episodeNumber,
          updatedAt: Date.now(),
          percentage: pct
        });
      }
    }
  }, [activeEpisodeId, allEpisodes, updateHistory]);

  if (allEpisodes.length === 0) return null;

  return (
    <div 
      onClick={handleScreenTouch}
      className="bg-black fixed inset-0 z-50 flex flex-col pb-24 select-none"
    >
      {/* Top Header overlay */}
      <div className={`absolute top-0 left-0 right-0 p-2 sm:p-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] flex items-center justify-between gap-1.5 z-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-all duration-500 max-w-full overflow-hidden ${
        areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="px-3 py-1 bg-black/50 rounded-full text-white font-bold text-xs pointer-events-auto border border-white/10 backdrop-blur-md shrink-0">
          {t('forYou', 'For You')}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
          <TopPointsBadge />
          {/* TON Payment Button */}
          <button 
            onClick={() => setShowTonModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#0098EA] to-blue-600 rounded-xl text-white font-black text-[11px] sm:text-xs shadow-md shadow-[#0098EA]/30 border border-[#0098EA]/40 active:scale-95 transition-transform shrink-0 whitespace-nowrap"
          >
            <Zap size={12} className="text-yellow-300 animate-pulse" />
            <span>{isArabic ? 'TON' : 'TON'}</span>
          </button>
        </div>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar touch-pan-y"
        style={{ scrollBehavior: 'smooth' }}
      >
        {allEpisodes.map((item, index) => {
          const { movie, episode: ep } = item;
          const isFav = favorites.includes(movie.id);
          const isLocked = !isVip && ep.episodeNumber > 6 && !unlockedEpisodes.includes(ep.id);
          const isCurrentActive = activeEpisodeId === ep.id;
          
          // Need unique key because same episode might appear (shouldn't if feed is unique, but just in case)
          const uniqueKey = `${ep.id}-${index}`;

          return (
          <div 
            key={uniqueKey} 
            data-episode-id={ep.id}
            className="reel-item relative w-full h-full snap-start snap-always touch-pan-y"
          >
            {isLocked ? (
              <div className="absolute inset-0 bg-[#050505] flex flex-col items-center justify-center z-10 px-6 text-center">
                <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-4 border border-red-500/30 shadow-lg shadow-red-600/20">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">{isArabic ? `الحلقة ${ep.episodeNumber} مغلقة` : `Episode ${ep.episodeNumber} Locked`}</h3>
                <p className="text-white/60 text-xs mb-6 max-w-xs leading-relaxed">
                  {isArabic 
                    ? 'الحلقات من 1 إلى 6 مجانية بالكامل! شاهد إعلان قصير لفتح هذه الحلقة والحلقة التالية معاً.' 
                    : 'Episodes 1-6 are free! Watch a short ad to unlock 2 episodes.'}
                </p>
                <button 
                  onClick={() => setShowUnlockModal(ep.id)}
                  className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black py-3.5 px-8 rounded-2xl shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-95 transition-all text-xs flex items-center gap-2"
                >
                  <Tv size={16} />
                  <span>{isArabic ? 'فتح بإعلان قصير' : 'Unlock with Short Ad'}</span>
                </button>
              </div>
            ) : (
              <ReelPlayer 
                url={ep.videoUrl} 
                isActive={isCurrentActive}
                duration={ep.duration}
                onComplete={() => {
                  useAppStore.getState().completeEpisode(ep.id);
                  setTimeout(() => {
                    scrollToNext(index + 1);
                  }, 300);
                }}
              />
            )}

            {/* Right Side Action Buttons */}
            <div className={`absolute right-3.5 bottom-24 flex flex-col items-center gap-4 z-20 transition-all duration-500 ${
              areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}>
              {/* Series Avatar Poster with Plus Badge */}
              <div 
                className="relative mb-1 group cursor-pointer"
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
              >
                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 shadow-xl shadow-red-600/20 group-active:scale-95 transition-transform">
                  <img 
                    src={movie.coverImage} 
                    alt={movie.title} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-red-600 text-white rounded-full p-0.5 shadow-md border border-black">
                  <Plus size={12} strokeWidth={3} />
                </div>
              </div>

              {/* Like / Favorite Button */}
              <button 
                onClick={() => toggleFavorite(movie.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 border shadow-lg group-active:scale-90 ${
                  isFav 
                    ? "bg-red-600/30 border-red-500/60 text-red-500 shadow-red-600/30" 
                    : "bg-black/45 border-white/15 text-white hover:border-white/30"
                }`}>
                  <Heart size={24} className={isFav ? "fill-red-500 text-red-500 animate-bounce" : "text-white"} />
                </div>
                <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {(movie.rating * 1250).toLocaleString()}
                </span>
              </button>
              
              {/* Comments Button */}
              <button 
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/45 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/15 group-active:scale-90 transition-all shadow-lg hover:border-white/30">
                  <MessageCircle size={22} className="fill-white/20" />
                </div>
                <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  2.4K
                </span>
              </button>

              {/* Save / Bookmark Button */}
              <button 
                onClick={() => toggleFavorite(movie.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/45 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/15 group-active:scale-90 transition-all shadow-lg hover:border-white/30">
                  <Bookmark size={22} className={isFav ? "fill-amber-400 text-amber-400" : "fill-white/20"} />
                </div>
                <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {t('save', 'حفظ')}
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: movie.title,
                      text: `مشاهدة ${movie.title} على Drama Reel!`,
                      url: window.location.href
                    }).catch(console.error);
                  }
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/25 border border-indigo-400/30 group-active:scale-90 transition-all">
                  <Share2 size={22} />
                </div>
                <span className="text-indigo-300 text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {t('share', 'مشاركة')}
                </span>
              </button>

              {/* Live Views Counter */}
              <div className="flex flex-col items-center gap-1 mt-2">
                <AnimatedViews baseViews={movie.views} className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex-col !gap-0.5" iconSize={26} />
              </div>
            </div>

            {/* Bottom Info Overlay */}
            <div className={`absolute bottom-0 left-0 right-16 p-4 pb-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-500 ${
              areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}>
              <div 
                className="pointer-events-auto space-y-2 cursor-pointer"
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-md border border-red-400/30">
                    {t('episodes', 'الحلقة')} {ep.episodeNumber}
                  </span>
                  <span className="px-2 py-0.5 bg-white/15 text-white/90 text-[10px] font-bold rounded-full backdrop-blur-md border border-white/10">
                    {movie.category}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                    ★ {movie.rating}
                  </span>
                </div>

                <h3 className="text-white font-extrabold text-base tracking-tight drop-shadow-lg truncate max-w-[250px]">
                  {movie.title}
                </h3>

                <p className="text-white/80 text-xs line-clamp-2 leading-relaxed drop-shadow-md">
                  {ep.title !== movie.title ? `${ep.title} - ` : ''}{movie.description}
                </p>

                <div className="pt-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/watch/${movie.id}?ep=${ep.id}`);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-red-600/30 flex items-center gap-1.5 border border-red-400/30 active:scale-95 transition-all"
                  >
                    <PlayCircle size={14} />
                    <span>{t('watchFullMovie', 'مشاهدة المسلسل')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Unlock Modal with Adsgram & VIP options */}
      {showUnlockModal && (
        <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-amber-500/30 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-md flex items-center gap-1">
              <Sparkles size={12} className="fill-black" />
              <span>{isArabic ? 'الحلقات 1 إلى 6 مجانية بالكامل!' : 'Episodes 1-6 are 100% Free!'}</span>
            </div>

            <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-orange-500 rounded-2xl flex items-center justify-center mb-3 text-white shadow-lg shadow-red-600/30">
              <Tv size={28} />
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              {isArabic ? 'مشاهدة إعلان قصير لفتح حلقتين' : 'Watch Short Ad to Unlock 2 Episodes'}
            </h3>
            
            <p className="text-white/60 text-xs mb-5 leading-relaxed">
              {isArabic 
                ? 'شاهد إعلان قصير لتمرير هذه الحلقة والحلقة التالية مجاناً، أو اشترك في VIP لمشاهدة جميع الحلقات بلا إعلانات.' 
                : 'Watch a quick ad to unlock this episode & the next one free, or activate VIP for zero ads.'}
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              {/* Option 1: Watch Ad */}
              <button 
                onClick={() => handleUnlockWithAdsgram(showUnlockModal)}
                disabled={isAdLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdLoading ? (
                  <span>{isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...'}</span>
                ) : (
                  <>
                    <Tv size={16} />
                    <span>{isArabic ? 'مشاهدة إعلان (فتح حلقتين)' : 'Watch Short Ad (Unlock 2 Ep)'}</span>
                  </>
                )}
              </button>

              {/* Option 2: Coins Unlock if available */}
              {coins >= 50 && (
                <button 
                  onClick={() => {
                    if (spendCoins(50, isArabic ? 'فتح حلقة' : 'Unlock Episode')) {
                      unlockEpisode(showUnlockModal);
                      setShowUnlockModal(null);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-yellow-300 font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Gift size={16} />
                  <span>{isArabic ? 'فتح مقابل 50 نقطة' : 'Unlock for 50 Coins'}</span>
                </button>
              )}

              {/* Option 3: Activate VIP */}
              <button 
                onClick={() => {
                  setShowUnlockModal(null);
                  setShowTonModal(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Crown size={16} className="fill-black" />
                <span>{isArabic ? 'تفعيل اشتراك VIP (بدون إعلانات)' : 'Activate VIP Pass (No Ads)'}</span>
              </button>

              {/* Option 4: Close */}
              <button 
                onClick={() => setShowUnlockModal(null)}
                className="w-full py-2 rounded-xl text-white/50 text-xs hover:text-white transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TON Crypto Payment Modal */}
      <TonPaymentModal 
        isOpen={showTonModal} 
        onClose={() => setShowTonModal(false)} 
      />
    </div>
  );
};

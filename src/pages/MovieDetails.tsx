import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Heart, Share2, Star, Clock, Layers, Globe, Sparkles, Lock } from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { MovieCard } from '../components/MovieCard';
import { AnimatedViews } from '../components/AnimatedViews';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { auth } from '../firebase';
import { getCurrentUserId } from '../services/referralService';

export const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, favorites, toggleFavorite, unlockedEpisodes, isVipActive } = useAppStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const movie = movies.find(m => m.id === id);
  const isFav = movie ? favorites.includes(movie.id) : false;
  const isVip = isVipActive();
  
  const totalDuration = movie ? (movie.episodes?.length ? movie.episodes.reduce((acc, ep) => acc + (ep.duration || 0), 0) : movie.duration) : 0;

  const images = movie ? (movie.gallery && movie.gallery.length > 0 ? movie.gallery : [movie.largeImage || movie.coverImage, movie.coverImage]).filter(Boolean) : [];
  const uniqueImages = Array.from(new Set(images));

  useEffect(() => {
    if (uniqueImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [uniqueImages.length]);

  if (!movie) return <div className="p-8 text-center text-white">Movie not found</div>;

  const similarWorks = movies.filter(m => m.category === movie.category && m.id !== movie.id).slice(0, 6);

  const handleShare = () => {
    const currentUserId = getCurrentUserId(auth.currentUser?.uid);
    const botUsername = 'DramaReel_bot';
    const shareUrl = `https://t.me/${botUsername}?startapp=movie_${movie.id}_${currentUserId}`;
    const text = encodeURIComponent(`🎬 شاهد مسلسل ${movie.title} مجاناً على Drama Reel!`);
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`;
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(tgShareUrl);
    } else if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `🎬 شاهد مسلسل ${movie.title} مجاناً على Drama Reel!`,
        url: shareUrl
      }).catch(console.error);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto hide-scrollbar bg-[#070709] flex flex-col relative pb-16" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Sticky Top Bar */}
      <div className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#070709]/90 via-[#070709]/60 to-transparent backdrop-blur-md">
        <div className="flex justify-between items-center px-4 py-3 max-w-4xl mx-auto">
          <button 
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/', { replace: true });
              }
            }} 
            className="w-10 h-10 bg-black/50 hover:bg-black/70 border border-white/15 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl transition-all active:scale-90"
            aria-label="Back"
          >
            <ArrowLeft size={20} className={isArabic ? 'rotate-180' : ''} />
          </button>

          <div className="flex items-center gap-2.5">
            <TopPointsBadge />
            <button 
              onClick={() => toggleFavorite(movie.id)} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 ${
                isFav ? 'bg-red-600/25 border-red-500/50 text-red-500' : 'bg-black/50 hover:bg-black/70 border-white/15 text-white'
              }`}
              aria-label="Favorite"
            >
              <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : ""} />
            </button>
            <button 
              onClick={handleShare}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 border border-white/15 rounded-2xl flex items-center justify-center text-white active:scale-90 backdrop-blur-xl transition-all"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Backdrop Slider */}
      <div className="relative w-full h-[360px] sm:h-[420px] -mt-16 overflow-hidden bg-black shrink-0">
        <AnimatePresence mode="popLayout">
          {uniqueImages.map((img, idx) => (
            idx === currentImageIndex && (
              <motion.div
                key={img}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${img || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop'})` }}
              />
            )
          ))}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/50 to-transparent z-10" />
        
        {/* Slider Indicators */}
        {uniqueImages.length > 1 && (
          <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5 z-20">
            {uniqueImages.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentImageIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-6 bg-red-600' : 'w-1.5 bg-white/40'}`} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="px-4 sm:px-6 -mt-12 relative z-30 max-w-4xl mx-auto w-full space-y-6">
        {/* Title & Metadata Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-red-600 text-[10px] font-extrabold rounded-lg uppercase tracking-wider text-white shadow">
              {isArabic ? 'حصري' : 'Featured'}
            </span>
            <span className="px-2.5 py-1 bg-white/10 border border-white/10 text-[10px] font-bold rounded-lg uppercase tracking-wider text-white/90">
              {movie.category}
            </span>
            {(movie.language === 'Dubbed' || movie.language === 'Subtitled') && (
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider text-white shadow border ${
                movie.language === 'Dubbed' ? 'bg-[#0098EA]/80 border-[#0098EA]/40' : 'bg-purple-600/80 border-purple-400/40'
              }`}>
                {t(movie.language.toLowerCase())}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            {movie.title}
          </h1>
          
          {/* Clean Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/70 font-semibold">
            <span className="flex items-center gap-1 font-bold text-amber-400 tabular-nums">
              <Star size={14} className="fill-amber-400"/> {movie.rating}
            </span>
            <span className="text-white/25">·</span>
            <span className="tabular-nums">{movie.releaseYear}</span>
            <span className="text-white/25">·</span>
            <span className="tabular-nums">{(movie.episodes?.length || 1)} {t('episodes')}</span>
            <span className="text-white/25">·</span>
            <AnimatedViews baseViews={movie.views} className="text-white/70" />
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => navigate(`/watch/${movie.id}`)}
              className="w-full h-12 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(229,9,20,0.45)] border border-white/15 active:scale-98 transition-all"
            >
              <Play fill="currentColor" size={18} />
              <span>{t('play', isArabic ? 'بدء المشاهدة الآن' : 'Play Now')}</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="w-full h-12 bg-white/[0.07] hover:bg-white/[0.12] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 border border-white/10 active:scale-98 transition-all"
            >
              <Share2 size={18} className="text-amber-400" />
              <span>{t('share', isArabic ? 'مشاركة المسلسل مع الأصدقاء' : 'Share Drama')}</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-3 bg-[#121217] rounded-2xl p-3.5 border border-white/10 divide-x divide-white/10 rtl:divide-x-reverse">
          <div className="flex flex-col items-center justify-center gap-1">
            <Layers className="text-red-500" size={16} />
            <span className="text-white font-extrabold text-sm tabular-nums">{movie.episodes?.length || 1}</span>
            <span className="text-[10px] text-white/45 font-bold uppercase">{t('episodes')}</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <Clock className="text-amber-400" size={16} />
            <span className="text-white font-extrabold text-sm tabular-nums">{totalDuration} {t('minutes', 'm')}</span>
            <span className="text-[10px] text-white/45 font-bold uppercase">{t('duration')}</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <Globe className="text-blue-400" size={16} />
            <span className="text-white font-extrabold text-sm">{movie.language}</span>
            <span className="text-[10px] text-white/45 font-bold uppercase">{t('language')}</span>
          </div>
        </div>

        {/* Synopsis & Credits */}
        <div className="bg-[#121217]/60 border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
            {movie.description}
          </p>

          {(movie.director || (movie.cast && movie.cast.length > 0)) && (
            <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-white/50">
              {movie.director && (
                <div className="flex gap-2">
                  <span className="font-bold text-white/40">{t('director', isArabic ? 'المخرج' : 'Director')}:</span>
                  <span className="text-white/90 font-medium">{movie.director}</span>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-bold text-white/40">{t('cast', isArabic ? 'البطولة' : 'Cast')}:</span>
                  <span className="text-white/90 font-medium">{movie.cast.join(' ، ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Episodes List */}
        {movie.episodes && movie.episodes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Layers size={18} className="text-red-500" />
                <span>{t('episodes', isArabic ? 'جميع الحلقات' : 'All Episodes')}</span>
              </h3>
              <span className="text-xs font-bold text-amber-400">
                {isArabic ? 'الحلقات 1-6 مجانية' : 'Ep 1-6 Free'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {movie.episodes.map(ep => {
                const isLong = ep.isLongEpisode || (ep.duration && ep.duration >= 360);
                const isLocked = !isVip && ep.episodeNumber > 6 && !unlockedEpisodes.includes(ep.id) && !isLong;

                return (
                  <div 
                    key={ep.id}
                    onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
                    className="group flex items-center gap-3.5 p-2.5 bg-[#121217] hover:bg-[#181820] rounded-2xl border border-white/[0.07] hover:border-red-500/30 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="w-24 h-16 bg-black rounded-xl overflow-hidden relative shrink-0 border border-white/10">
                      <img 
                        src={movie.coverImage || ''} 
                        alt={ep.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        {isLocked ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                            <Lock size={13} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow">
                            <Play size={13} fill="currentColor" className="ml-0.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                          {isArabic ? `الحلقة ${ep.episodeNumber}` : `Episode ${ep.episodeNumber}`} · {ep.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-white/45">
                        <span className="tabular-nums">{ep.duration || 2} {t('minutes', 'm')}</span>
                        <span>·</span>
                        <span className="text-red-400 font-bold">HD</span>
                        {ep.episodeNumber <= 6 && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 font-bold">{isArabic ? 'مجاني' : 'Free'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Similar Dramas Section */}
        {similarWorks.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <span>{isArabic ? 'أعمال مشابهة قد تعجبك' : 'More Like This'}</span>
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {similarWorks.map(sim => (
                <div key={sim.id} className="snap-start shrink-0">
                  <MovieCard movie={sim} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


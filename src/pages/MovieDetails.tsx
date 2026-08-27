import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Heart, Share2, Star, Clock, Eye, Layers } from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { MovieCard } from '../components/MovieCard';
import { AnimatedViews } from '../components/AnimatedViews';

export const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { movies, favorites, toggleFavorite } = useAppStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const movie = movies.find(m => m.id === id);
  const isFav = movie ? favorites.includes(movie.id) : false;
  
  const totalDuration = movie ? (movie.episodes?.length ? movie.episodes.reduce((acc, ep) => acc + (ep.duration || 0), 0) : movie.duration) : 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const images = movie ? (movie.gallery && movie.gallery.length > 0 ? movie.gallery : [movie.largeImage || movie.coverImage, movie.coverImage]).filter(Boolean) : [];
  const uniqueImages = Array.from(new Set(images));

  useEffect(() => {
    if (uniqueImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [uniqueImages.length]);

  if (!movie) return <div className="p-8 text-center text-white">Movie not found</div>;

  const similarWorks = movies.filter(m => m.category === movie.category && m.id !== movie.id);

  return (
    <div className="h-full w-full overflow-hidden bg-[#050505] flex flex-col relative">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#050505]/80 to-transparent">
        <div className="flex justify-between items-center p-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-3">
            <button onClick={() => toggleFavorite(movie.id)} className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors">
              <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : ""} />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: movie.title,
                    text: `Check out ${movie.title} on Drama Reel!`,
                    url: window.location.href
                  }).catch(console.error);
                }
              }}
              className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white active:opacity-80 backdrop-blur-md transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image Slider */}
      <div className="flex-none relative w-full h-[45%] overflow-hidden bg-black">
        <AnimatePresence mode="popLayout">
          {uniqueImages.map((img, idx) => (
            idx === currentImageIndex && (
              <motion.div
                key={img}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${img || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop'})` }}
              />
            )
          ))}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
        
        {/* Slider Indicators */}
        {uniqueImages.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 z-20">
            {uniqueImages.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-500 ${idx === currentImageIndex ? 'w-4 bg-red-600' : 'w-1.5 bg-white/40'}`} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 -mt-16 relative z-30 min-h-0">
        <div className="flex-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-red-600 text-[10px] font-bold rounded-md uppercase tracking-wider text-white">Featured</span>
            <span className="px-3 py-1 bg-white/10  text-[10px] font-bold rounded-md uppercase tracking-wider text-white">{movie.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-none tracking-tighter line-clamp-2">{movie.title.toUpperCase()}</h1>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/70 mb-4">
            <span className="flex items-center gap-1 font-bold text-yellow-500"><Star size={14} className="fill-yellow-500"/> {movie.rating}</span>
            <span>{movie.releaseYear}</span>
            <span>{(movie.episodes?.length || 0)} {t('episodes')}</span>
            <AnimatedViews baseViews={movie.views} className="text-white/70" />
          </div>

          <button 
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 mb-4 shadow-[0_4px_20px_rgba(229,9,20,0.5)] border border-white/10 active:opacity-80 transition-all"
          >
            <Play fill="currentColor" size={20} /> {t('play')}
          </button>
        </div>

        {/* Scrollable details if needed */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 space-y-4">
          <div className="flex justify-around bg-[#1A1A1A] rounded-2xl p-3 border border-white/5">
            <div className="flex flex-col items-center">
              <Layers className="text-neutral-500 mb-1" size={16} />
              <span className="text-white font-bold text-sm">{movie.episodes?.length || 0}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{t('episodes')}</span>
            </div>
            <div className="w-px bg-neutral-800" />
            <div className="flex flex-col items-center">
              <Clock className="text-neutral-500 mb-1" size={16} />
              <span className="text-white font-bold text-sm">{totalDuration} {t('minutes', 'm')}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{t('duration')}</span>
            </div>
            <div className="w-px bg-neutral-800" />
            <div className="flex flex-col items-center">
              <Globe className="text-neutral-500 mb-1" size={16} />
              <span className="text-white font-bold text-sm">{movie.language}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{t('language')}</span>
            </div>
          </div>

          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
            {movie.description}
          </p>

          <div className="space-y-2 text-xs sm:text-sm text-neutral-400">
            {movie.director && (
              <div className="flex">
                <span className="w-24 font-bold">{t('director', 'Director')}:</span>
                <span className="text-white flex-1">{movie.director}</span>
              </div>
            )}
            {movie.cast && (
              <div className="flex">
                <span className="w-24 font-bold">{t('cast', 'Cast')}:</span>
                <span className="text-white flex-1">{movie.cast.join(', ')}</span>
              </div>
            )}
          </div>

          {movie.episodes && movie.episodes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-3">{t('episodes', 'Episodes')}</h3>
              <div className="space-y-3">
                {movie.episodes.map(ep => (
                  <div 
                    key={ep.id}
                    onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
                    className="flex gap-4 p-3 bg-[#111111] rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="w-24 h-16 bg-[#1A1A1A] rounded-lg overflow-hidden relative flex-shrink-0">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${movie.coverImage || ''})` }} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play size={16} className="text-white" fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{ep.episodeNumber}. {ep.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-neutral-400">{ep.duration || 0} {t('minutes', 'm')}</span>
                        <span className="px-1.5 py-0.5 bg-red-600 text-[8px] font-bold uppercase rounded text-white tracking-wider">HD</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper for icon
function Globe(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
}

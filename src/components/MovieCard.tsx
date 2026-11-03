import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie } from '../types';
import { Play, Star, Heart, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { AnimatedViews } from './AnimatedViews';

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop";

interface MovieCardProps {
  movie: Movie;
  featured?: boolean;
  rank?: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, featured, rank }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { toggleFavorite, favorites } = useAppStore();
  const isFav = favorites.includes(movie.id);

  const [imgSrc, setImgSrc] = useState<string>(movie.largeImage || movie.coverImage || DEFAULT_IMAGE);
  const [thumbSrc, setThumbSrc] = useState<string>(movie.coverImage || DEFAULT_IMAGE);

  useEffect(() => {
    setImgSrc(movie.largeImage || movie.coverImage || DEFAULT_IMAGE);
    setThumbSrc(movie.coverImage || DEFAULT_IMAGE);
  }, [movie.largeImage, movie.coverImage]);

  if (featured) {
    return (
      <motion.div 
        whileTap={{ scale: 0.99 }}
        className="relative w-full h-full rounded-[28px] overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.8)] group bg-[#0E0E12] border border-white/10"
      >
        <img 
          src={imgSrc}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
          onError={() => setImgSrc(DEFAULT_IMAGE)}
          onClick={() => navigate(`/movie/${movie.id}`)}
        />
        {/* Multi-stop cinema scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/55 to-black/20 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/80 via-transparent to-transparent z-10 pointer-events-none" />

        {/* Top Floating Badge Row */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg shadow-red-600/30 border border-red-400/30">
            <Play size={10} fill="currentColor" />
            <span>{isArabic ? 'عرض حصري مميز' : 'Featured Drama'}</span>
          </div>
          {(movie.language === 'Dubbed' || movie.language === 'Subtitled') && (
            <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider text-white border backdrop-blur-md shadow-lg ${
              movie.language === 'Dubbed' 
                ? 'bg-[#0098EA]/85 border-[#0098EA]/50 text-white' 
                : 'bg-purple-600/85 border-purple-400/50'
            }`}>
              {t(movie.language.toLowerCase())}
            </span>
          )}
        </div>

        {/* Bottom Content Area */}
        <div className="absolute bottom-6 left-5 right-5 sm:left-7 sm:right-7 z-20 space-y-3 pointer-events-auto" dir={isArabic ? 'rtl' : 'ltr'}>
          {/* Clean Editorial Metadata Line */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Star size={13} className="fill-amber-400" />
              <span className="tabular-nums">{movie.rating}</span>
            </span>
            <span className="text-white/30">·</span>
            <span className="text-white/90">{movie.category}</span>
            <span className="text-white/30">·</span>
            <span className="tabular-nums">{movie.releaseYear}</span>
            {(movie.episodes?.length || 0) > 0 && (
              <>
                <span className="text-white/30">·</span>
                <span className="text-red-400 font-bold tabular-nums">
                  {movie.episodes?.length} {t('episodes')}
                </span>
              </>
            )}
            <span className="text-white/30">·</span>
            <AnimatedViews baseViews={movie.views} className="text-xs text-white/80 font-semibold" iconSize={13} />
          </div>

          <h2 
            className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-2" 
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            {movie.title}
          </h2>
          
          <p 
            className="text-white/70 max-w-xl text-xs sm:text-sm line-clamp-2 leading-relaxed" 
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            {movie.description}
          </p>

          <div className="flex items-center gap-3 pt-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/watch/${movie.id}`); }}
              className="flex-1 sm:flex-initial sm:min-w-[180px] h-12 px-6 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_8px_25px_rgba(229,9,20,0.45)] border border-white/15"
            >
              <Play size={18} fill="currentColor" />
              <span>{t('watch')}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(movie.id); }}
              className={`w-12 h-12 flex-none rounded-2xl transition-all flex items-center justify-center active:scale-90 backdrop-blur-xl border shadow-lg ${
                isFav 
                  ? 'bg-red-600/25 border-red-500/50 text-red-500' 
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
              }`}
              aria-label="Favorite"
            >
              <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="space-y-2 cursor-pointer group flex-none w-36 sm:w-40"
    >
      <div className="aspect-[2/3] bg-[#121217] rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:border-red-500/40 transition-colors">
        <img 
          src={thumbSrc}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-108" 
          onError={() => setThumbSrc(DEFAULT_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />
        
        {/* Hover Play Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none"> 
           <div className="w-11 h-11 bg-red-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/40 transform scale-90 group-hover:scale-100 transition-transform">
              <Play size={20} fill="currentColor" className="ml-0.5" />
           </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold text-amber-400 flex items-center gap-1 z-20 pointer-events-none tabular-nums">
          <Star size={10} className="fill-amber-400" />
          <span>{movie.rating}</span>
        </div>

        {/* Language Tag */}
        {(movie.language === 'Dubbed' || movie.language === 'Subtitled') && (
          <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider text-white z-20 pointer-events-none shadow-md backdrop-blur-md border ${
            movie.language === 'Dubbed' 
              ? 'bg-[#0098EA]/90 border-[#0098EA]/40' 
              : 'bg-purple-600/90 border-purple-400/40'
          }`}>
            {t(movie.language.toLowerCase())}
          </div>
        )}

        {/* Rank Number if Trending */}
        {rank !== undefined && (
          <div className="absolute bottom-2 right-2.5 z-20 pointer-events-none">
            <span className="text-3xl font-black italic text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tabular-nums leading-none">
              #{rank}
            </span>
          </div>
        )}

        {/* Bottom Episode Count inside poster */}
        {(movie.episodes?.length || 0) > 1 && (
          <div className="absolute bottom-2 left-2.5 z-20 flex items-center gap-1 text-[10px] font-bold text-white/90 drop-shadow pointer-events-none">
            <Layers size={11} className="text-red-500" />
            <span className="tabular-nums">{movie.episodes?.length} {t('episodes')}</span>
          </div>
        )}
      </div>

      <div className="px-0.5">
        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate leading-snug">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between gap-1 mt-1 text-[11px] text-white/45">
          <span className="truncate">{movie.category}</span>
          <AnimatedViews baseViews={movie.views} className="text-[10px] text-white/40 shrink-0" iconSize={10} />
        </div>
      </div>
    </motion.div>
  );
};


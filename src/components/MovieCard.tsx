import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie } from '../types';
import { Play, Star, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { AnimatedViews } from './AnimatedViews';

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop";

interface MovieCardProps {
  movie: Movie;
  featured?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, featured }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        whileTap={{ scale: 0.98 }}
        className="relative w-full h-full rounded-3xl overflow-hidden cursor-pointer shadow-2xl group bg-[#111]"
      >
        <img 
          src={imgSrc}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          onError={() => setImgSrc(DEFAULT_IMAGE)}
          onClick={() => navigate(`/movie/${movie.id}`)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-8 left-6 right-6 z-20 space-y-4 pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-red-600 text-[10px] font-bold rounded-md uppercase tracking-wider text-white">Featured</span>
            <span className="px-3 py-1 bg-black/40  text-[10px] font-bold rounded-md uppercase tracking-wider text-white border border-white/10">
              {movie.category} • {movie.releaseYear}
            </span>
            <AnimatedViews baseViews={movie.views} className="text-[10px] text-white font-bold bg-black/40 px-3 py-1 rounded-md border border-white/10" iconSize={12} />
          </div>
          <h2 className="text-4xl font-black text-white leading-none tracking-tighter" onClick={() => navigate(`/movie/${movie.id}`)}>{movie.title.toUpperCase()}</h2>
          <p className="text-white/70 max-w-lg text-sm line-clamp-2" onClick={() => navigate(`/movie/${movie.id}`)}>{movie.description}</p>
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/watch/${movie.id}`); }}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-full font-bold flex items-center justify-center gap-2 transition-all active:opacity-80 shadow-[0_4px_20px_rgba(229,9,20,0.5)] border border-white/10"
            >
              <Play size={20} fill="currentColor" /> {t('watch')}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(movie.id); }}
              className="w-12 h-12 flex-none bg-white/10 hover:bg-white/20 border border-white/20  text-white rounded-full transition-all flex items-center justify-center active:opacity-80 shadow-lg"
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
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="space-y-2 cursor-pointer group flex-none w-36"
    >
      <div className="aspect-[2/3] bg-[#1A1A1A] rounded-2xl overflow-hidden relative border border-white/5 shadow-lg">
        <img 
          src={thumbSrc}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-110" 
          onError={() => setThumbSrc(DEFAULT_IMAGE)}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none"> 
           <div className="w-10 h-10 bg-white/20  rounded-full flex items-center justify-center text-white">
              <Play size={24} fill="currentColor" className="ml-1" />
           </div>
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60  rounded-lg text-[10px] font-bold text-yellow-500 flex items-center gap-1 z-20 pointer-events-none">
          ★ {movie.rating}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors truncate">{movie.title}</h4>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="text-xs text-white/40 truncate">{movie.category} • {(movie.episodes?.length || 0) > 1 ? `${movie.episodes?.length || 0} ${t('episodes')}` : movie.releaseYear}</p>
          <AnimatedViews baseViews={movie.views} className="text-[10px] text-white/30" iconSize={10} />
        </div>
      </div>
    </motion.div>
  );
};

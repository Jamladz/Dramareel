import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Heart, Trash2, Play, Search, Film, Sparkles } from 'lucide-react';

export const Favorites = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, favorites, toggleFavorite, clearFavorites } = useAppStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const favoriteMovies = movies
    .filter(m => favorites.includes(m.id))
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="h-full w-full overflow-hidden bg-[#050505] flex flex-col p-4 sm:p-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <div className="flex-none flex items-center justify-between mb-5 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            {isArabic ? 'قائمة المفضلة' : 'My Favorites'}
            <Sparkles size={18} className="text-red-500" />
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {isArabic 
              ? `لديك ${favorites.length} مسلسل مفضل محفوظ` 
              : `${favorites.length} saved favorite dramas`}
          </p>
        </div>

        {favorites.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm(isArabic ? 'هل تريد مسح جميع المسلسلات من المفضلة؟' : 'Clear all items from favorites?')) {
                clearFavorites();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold active:scale-95 transition-all"
          >
            <Trash2 size={14} />
            <span>{isArabic ? 'مسح الكل' : 'Clear All'}</span>
          </button>
        )}
      </div>

      {/* Search Input Bar if favorites >= 3 */}
      {favorites.length >= 3 && (
        <div className="relative mb-4">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-white/40 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'ابحث في قائمتك المفضلة...' : 'Search in favorites...'}
            className={`w-full bg-[#141414] border border-white/10 rounded-2xl py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/60 transition-all ${
              isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>
      )}

      {/* Main Content List / Grid */}
      <div className="flex-1 overflow-y-auto pb-28 hide-scrollbar">
        {favoriteMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteMovies.map(movie => (
              <div 
                key={movie.id} 
                className="group relative bg-[#121212] border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all hover:border-red-500/40 shadow-lg"
              >
                {/* Poster Image */}
                <div 
                  className="relative aspect-[3/4] w-full bg-neutral-900 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/watch/${movie.id}`)}
                >
                  <img 
                    src={movie.coverImage || movie.largeImage} 
                    alt={movie.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-80" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={20} className="fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Remove Favorite Quick Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(movie.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-black/80 active:scale-90 transition-all shadow-md z-10"
                    title={isArabic ? 'حذف من المفضلة' : 'Remove from favorites'}
                  >
                    <Heart size={16} className="fill-red-500" />
                  </button>

                  {/* Rating Tag */}
                  <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-mono text-amber-400 font-bold">
                    ★ {movie.rating}
                  </div>
                </div>

                {/* Movie Title & Action */}
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xs font-extrabold text-white truncate mb-1" title={movie.title}>
                      {movie.title}
                    </h3>
                    <p className="text-[10px] text-white/40 truncate">
                      {movie.episodes?.length || 30} {isArabic ? 'حلقة' : 'Episodes'}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/watch/${movie.id}`)}
                    className="mt-3 w-full py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-xl text-red-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Play size={12} className="fill-red-400" />
                    <span>{isArabic ? 'مشاهدة' : 'Watch Now'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-white/30 h-64 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
              <Film size={32} />
            </div>
            <p className="font-bold text-sm text-white/50">
              {searchQuery 
                ? (isArabic ? 'لا توجد نتائج مطابقة للبحث' : 'No matching results found')
                : (isArabic ? 'لم تقم بإضافة أي مسلسل للمفضلة بعد' : 'No favorites saved yet')}
            </p>
            <p className="text-xs text-white/30 max-w-xs text-center">
              {isArabic ? 'اضغط على زر القلب في أي مسلسل لإضافته إلى قائمتك المفضلة هنا' : 'Click the heart icon on any drama to save it to your favorites list.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


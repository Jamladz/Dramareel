import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Heart, Trash2, Play, Search, Film, Sparkles, Star } from 'lucide-react';
import { TopPointsBadge } from '../components/TopPointsBadge';

export const Favorites = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, favorites, toggleFavorite, clearFavorites } = useAppStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const favoriteMovies = movies
    .filter(m => favorites.includes(m.id))
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="h-full w-full overflow-hidden bg-[#070709] flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Sticky Header Bar */}
      <div className="flex-none px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#070709]/85 backdrop-blur-xl z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <Heart size={18} className="fill-red-500" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {isArabic ? 'قائمتي المفضلة' : 'My Favorites'}
              </h1>
              <p className="text-[11px] text-white/45">
                {isArabic 
                  ? `${favorites.length} مسلسل محفوظ في مفضلتك` 
                  : `${favorites.length} saved favorite dramas`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      clearFavorites();
                      setConfirmClear(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-extrabold active:scale-95 transition-all"
                  >
                    {isArabic ? 'تأكيد المسح' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs font-bold"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-bold active:scale-95 transition-all"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">{isArabic ? 'مسح الكل' : 'Clear All'}</span>
                </button>
              )
            )}
            <TopPointsBadge />
          </div>
        </div>
      </div>

      {/* Main Content List / Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-28 hide-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Search Input Bar if favorites >= 3 */}
          {favorites.length >= 3 && (
            <div className="relative">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-white/40 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في قائمتك المفضلة...' : 'Search in favorites...'}
                className={`w-full bg-[#121217] border border-white/10 rounded-2xl py-2.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-red-500/60 transition-all ${
                  isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4'
                }`}
              />
            </div>
          )}

          {favoriteMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {favoriteMovies.map(movie => (
                <div 
                  key={movie.id} 
                  className="group relative bg-[#121217] border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all hover:border-red-500/40 shadow-lg"
                >
                  {/* Poster Image */}
                  <div 
                    className="relative aspect-[2/3] w-full bg-neutral-900 cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/watch/${movie.id}`)}
                  >
                    <img 
                      src={movie.coverImage || movie.largeImage} 
                      alt={movie.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-black/30 opacity-90" />

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
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-black/65 border border-white/15 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-black/85 active:scale-90 transition-all shadow-md z-10"
                      title={isArabic ? 'حذف من المفضلة' : 'Remove from favorites'}
                    >
                      <Heart size={15} className="fill-red-500" />
                    </button>

                    {/* Rating Tag */}
                    <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg text-[10px] tabular-nums text-amber-400 font-bold flex items-center gap-1">
                      <Star size={10} className="fill-amber-400" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>

                  {/* Movie Title & Action */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-white truncate mb-0.5" title={movie.title}>
                        {movie.title}
                      </h3>
                      <p className="text-[11px] text-white/45 truncate tabular-nums">
                        {movie.category} · {movie.episodes?.length || 1} {isArabic ? 'حلقة' : 'Episodes'}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/watch/${movie.id}`)}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-red-600/20 to-orange-500/15 hover:from-red-600 hover:to-orange-500 border border-red-500/35 rounded-xl text-red-400 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Play size={13} className="fill-current" />
                      <span>{isArabic ? 'مشاهدة الآن' : 'Watch Now'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-white/30 py-20 space-y-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                <Film size={30} />
              </div>
              <p className="font-bold text-sm text-white/60">
                {searchQuery 
                  ? (isArabic ? 'لا توجد نتائج مطابقة للبحث' : 'No matching results found')
                  : (isArabic ? 'لم تقم بإضافة أي مسلسل للمفضلة بعد' : 'No favorites saved yet')}
              </p>
              <p className="text-xs text-white/35 max-w-xs">
                {isArabic ? 'اضغط على أيقونة القلب في أي مسلسل لحفظه في قائمتك المفضلة والرجوع إليه بسهولة' : 'Tap the heart icon on any drama to save it to your favorites list.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                >
                  {isArabic ? 'استكشف المسلسلات' : 'Explore Dramas'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



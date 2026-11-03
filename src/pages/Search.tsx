import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowLeft, Film } from 'lucide-react';
import { useAppStore } from '../store';
import { MovieCard } from '../components/MovieCard';
import { TopPointsBadge } from '../components/TopPointsBadge';

export const Search = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const navigate = useNavigate();
  const { movies } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(movies.map(m => m.category).filter(Boolean))), [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesQuery = movie.title.toLowerCase().includes(query.toLowerCase()) ||
        (movie.description && movie.description.toLowerCase().includes(query.toLowerCase()));
      const matchesCat = activeCategory ? movie.category === activeCategory : true;
      return matchesQuery && matchesCat;
    });
  }, [movies, query, activeCategory]);

  return (
    <div className="h-full w-full overflow-hidden bg-[#070709] flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex-none px-4 sm:px-6 pt-4 pb-3 border-b border-white/[0.06] bg-[#070709]/90 backdrop-blur-xl z-20">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-all shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={18} className={isArabic ? 'rotate-180' : ''} />
            </button>

            <div className="relative flex-1">
              <SearchIcon className={`absolute top-1/2 -translate-y-1/2 text-white/40 ${isArabic ? 'right-3.5' : 'left-3.5'}`} size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={`w-full bg-[#121217] border border-white/10 text-white rounded-2xl py-2.5 text-xs sm:text-sm focus:outline-none focus:border-red-500 transition shadow-inner font-medium ${
                  isArabic ? 'pr-10 pl-9' : 'pl-10 pr-9'
                }`}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 ${
                    isArabic ? 'left-3' : 'right-3'
                  }`}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <TopPointsBadge />
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === null 
                  ? 'bg-red-600 text-white shadow-[0_4px_15px_rgba(229,9,20,0.35)]' 
                  : 'bg-white/[0.05] text-white/65 hover:bg-white/10 border border-white/5'
              }`}
            >
              {t('all', isArabic ? 'الكل' : 'All')}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-red-600 text-white shadow-[0_4px_15px_rgba(229,9,20,0.35)]' 
                    : 'bg-white/[0.05] text-white/65 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-28 hide-scrollbar">
        <div className="max-w-5xl mx-auto">
          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
              {filteredMovies.map(movie => (
                <div key={movie.id} className="w-full flex justify-center">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/25">
                <Film size={30} />
              </div>
              <p className="text-sm font-bold text-white/60">
                {t('noResults', isArabic ? 'لم يتم العثور على نتائج مطابقة' : 'No results found.')}
              </p>
              <button
                onClick={() => { setQuery(''); setActiveCategory(null); }}
                className="text-xs font-bold text-red-400 hover:text-red-300 underline"
              >
                {isArabic ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


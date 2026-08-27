import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { useAppStore } from '../store';
import { MovieCard } from '../components/MovieCard';
import { TopPointsBadge } from '../components/TopPointsBadge';

export const Search = () => {
  const { t } = useTranslation();
  const { movies } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(movies.map(m => m.category))), [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesQuery = movie.title.toLowerCase().includes(query.toLowerCase());
      const matchesCat = activeCategory ? movie.category === activeCategory : true;
      return matchesQuery && matchesCat;
    });
  }, [movies, query, activeCategory]);

  return (
    <div className="h-full w-full overflow-hidden bg-[#050505] flex flex-col">
      <div className="flex-none p-6 pb-2">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#1A1A1A] border border-white/5 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-red-600 transition shadow-lg font-medium text-sm"
            />
          </div>
          <TopPointsBadge />
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors uppercase tracking-wider ${
              activeCategory === null ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {t('all', 'All')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors uppercase tracking-wider ${
                activeCategory === cat ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 hide-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMovies.map(movie => (
            <div key={movie.id} className="h-64 sm:h-80">
               <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center text-neutral-500 mt-20">
            {t('noResults', 'No results found.')}
          </div>
        )}
      </div>
    </div>
  );
};

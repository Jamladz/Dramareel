import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { MovieCard } from '../components/MovieCard';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { Play, Search, Trophy, ChevronRight, ChevronLeft, Flame, Sparkles, Clock, Crown } from 'lucide-react';
import { fetchMoviesFromDB } from '../services/movieService';
import { AnimatePresence, motion } from 'motion/react';

export const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, setMovies, history, isVipActive } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isVip = isVipActive();

  useEffect(() => {
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      setAvatar((window as any).Telegram.WebApp.initDataUnsafe.user.photo_url);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (movies.length > 0) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchMoviesFromDB();
        setMovies(data);
      } catch (err) {
        console.error("Error fetching movies", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setMovies, movies.length]);

  const [featuredIndex, setFeaturedIndex] = useState(0);

  const featuredList = useMemo(() => movies.slice(0, 6), [movies]);

  useEffect(() => {
    if (featuredList.length > 1) {
      const interval = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % featuredList.length);
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [featuredList.length]);

  const categories = useMemo(() => Array.from(new Set(movies.map(m => m.category).filter(Boolean))), [movies]);

  const continueWatchingItems = useMemo(() => {
    return Object.values(history)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(h => ({
        ...h,
        movie: movies.find(m => m.id === h.movieId)!
      }))
      .filter(h => h.movie)
      .slice(0, 5);
  }, [history, movies]);

  const filteredMovies = useMemo(() => {
    if (!selectedCategory) return movies;
    return movies.filter(m => m.category === selectedCategory);
  }, [movies, selectedCategory]);

  const trending = useMemo(() => [...filteredMovies].sort((a, b) => b.views - a.views), [filteredMovies]);
  const newReleases = useMemo(() => [...filteredMovies].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [filteredMovies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-red-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.4)] animate-pulse">
            <Play size={24} className="text-white ml-0.5" fill="currentColor" />
          </div>
          <span className="text-xs font-extrabold tracking-widest uppercase text-white/60">{t('loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white/50 space-y-4 p-6 text-center">
        <p className="font-bold text-sm">{t('noContent', 'No content available')}</p>
        <button onClick={() => navigate('/admin')} className="bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all">
          {t('goToAdmin', 'Go to Admin Panel')}
        </button>
      </div>
    );
  }

  const featured = featuredList[featuredIndex] || movies[0];

  return (
    <div className="h-full w-full flex flex-col bg-[#070709] overflow-y-auto overflow-x-hidden pb-28 hide-scrollbar" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Sticky Glassmorphic Top App Bar */}
      <header className="sticky top-0 flex-none flex items-center justify-between px-4 sm:px-6 py-3 gap-2 z-40 bg-[#070709]/85 backdrop-blur-xl border-b border-white/[0.06] max-w-full">
        <div className="flex items-center gap-2.5 min-w-0 shrink" dir="ltr">
          <div className="w-9 h-9 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(229,9,20,0.35)] shrink-0 border border-white/15">
            <Play size={18} className="text-white ml-0.5" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base sm:text-xl font-black tracking-tighter text-white leading-none">
              DRAMA<span className="text-red-500">REEL</span>
            </h1>
            <span className="text-[9px] font-semibold text-white/40 tracking-widest uppercase">
              {isArabic ? 'سينما الدراما القصيرة' : 'Short Drama Cinema'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => navigate('/search')}
            className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] rounded-xl border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 shrink-0"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
          <TopPointsBadge />
          <button 
            onClick={() => navigate('/profile')} 
            className="relative active:scale-95 transition-transform shrink-0"
          >
            <img 
              src={avatar} 
              referrerPolicy="no-referrer"
              className={`w-9 h-9 rounded-xl object-cover bg-[#16161C] border ${
                isVip ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'border-white/15'
              }`} 
              alt="Profile" 
            />
            {isVip && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shadow">
                <Crown size={9} className="fill-black" />
              </div>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 pt-3 max-w-6xl mx-auto w-full">
        {/* Category Filter Strip */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto px-4 sm:px-6 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === null
                  ? 'bg-red-600 text-white shadow-[0_4px_15px_rgba(229,9,20,0.35)]'
                  : 'bg-white/[0.05] text-white/65 hover:bg-white/[0.1] hover:text-white border border-white/5'
              }`}
            >
              {isArabic ? 'الكل' : 'All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-[0_4px_15px_rgba(229,9,20,0.35)]'
                    : 'bg-white/[0.05] text-white/65 hover:bg-white/[0.1] hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Hero / Featured Showcase */}
        <div className="px-4 sm:px-6">
          <div className="relative h-[420px] sm:h-[460px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={featured.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <MovieCard movie={featured} featured />
              </motion.div>
            </AnimatePresence>

            {/* Carousel Pagination Indicators */}
            {featuredList.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
                {featuredList.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setFeaturedIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === featuredIndex 
                        ? 'w-6 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Contest Luxury Banner */}
        <div className="px-4 sm:px-6">
          <button 
            onClick={() => navigate('/weekly-contest')}
            className="w-full relative overflow-hidden bg-gradient-to-r from-[#2A1F0D] via-[#1E170B] to-[#141210] border border-amber-500/35 hover:border-amber-400/60 rounded-2xl p-4 shadow-[0_10px_30px_rgba(245,158,11,0.12)] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 relative z-10 text-start">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 text-black">
                <Trophy size={22} className="fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                    {isArabic ? 'المسابقة الأسبوعية للإحالات' : 'Weekly Referral Contest'}
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                    {isArabic ? 'جوائز VIP' : 'VIP Prizes'}
                  </span>
                </div>
                <p className="text-xs text-amber-200/75 mt-0.5">
                  {isArabic ? 'تنافس مع الأصدقاء واربح باقات VIP مجاناً كل أسبوع!' : 'Compete & win free VIP passes every week!'}
                </p>
              </div>
            </div>
            
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 relative z-10 text-amber-300 group-hover:bg-amber-500 group-hover:text-black transition-all">
              {isArabic ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>
        </div>

        {/* Continue Watching Strip (if user has history) */}
        {continueWatchingItems.length > 0 && !selectedCategory && (
          <section className="space-y-3">
            <div className="px-4 sm:px-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-red-500" />
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {isArabic ? 'متابعة المشاهدة' : 'Continue Watching'}
                </h3>
              </div>
              <button 
                onClick={() => navigate('/history')} 
                className="text-white/50 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span>{t('viewAll', isArabic ? 'عرض الكل' : 'View All')}</span>
                {isArabic ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            <div className="flex overflow-x-auto gap-3.5 px-4 sm:px-6 pb-2 snap-x hide-scrollbar">
              {continueWatchingItems.map(({ movie, episodeNumber, episodeId, percentage }) => {
                const epNum = episodeNumber || 1;
                const targetUrl = episodeId ? `/watch/${movie.id}?ep=${episodeId}` : `/watch/${movie.id}`;
                return (
                  <div
                    key={`cont-${movie.id}`}
                    onClick={() => navigate(targetUrl)}
                    className="snap-start shrink-0 w-64 bg-[#121217] hover:bg-[#17171E] border border-white/10 rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer active:scale-98 transition-all group"
                  >
                    <div className="w-16 h-20 rounded-xl overflow-hidden relative shrink-0 bg-black">
                      <img 
                        src={movie.coverImage || movie.largeImage} 
                        alt={movie.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                          <Play size={12} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-[11px] text-amber-400 font-bold mt-0.5">
                        {isArabic ? `الحلقة ${epNum}` : `Episode ${epNum}`}
                      </p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full" 
                          style={{ width: `${Math.max(8, percentage)}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-white/40 font-mono mt-1 block tabular-nums">
                        {Math.round(percentage)}% {isArabic ? 'مكتمل' : 'watched'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* New Releases Section */}
        <section className="space-y-3.5">
          <div className="px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {t('newReleases')}
              </h3>
            </div>
            <button 
              onClick={() => navigate('/search')} 
              className="text-white/50 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>{t('viewAll', isArabic ? 'عرض الكل' : 'View All')}</span>
              {isArabic ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 sm:px-6 pb-2 snap-x hide-scrollbar">
            {newReleases.map(movie => (
              <div key={`new-${movie.id}`} className="snap-start shrink-0">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>

        {/* Trending Today Section with Rank Numbers */}
        <section className="space-y-3.5">
          <div className="px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-red-500" />
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {t('trendingToday')}
              </h3>
            </div>
            <button 
              onClick={() => navigate('/search')} 
              className="text-white/50 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>{t('viewAll', isArabic ? 'عرض الكل' : 'View All')}</span>
              {isArabic ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 sm:px-6 pb-4 snap-x hide-scrollbar">
            {trending.map((movie, idx) => (
              <div key={`trend-${movie.id}`} className="snap-start shrink-0">
                <MovieCard movie={movie} rank={idx + 1} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};


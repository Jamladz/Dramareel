import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { MovieCard } from '../components/MovieCard';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { Play, Search, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';
import { fetchMoviesFromDB } from '../services/movieService';
import { AnimatePresence, motion } from 'motion/react';

export const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { movies, setMovies, coins, isVipActive } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  const isVip = isVipActive();

  useEffect(() => {
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      setAvatar((window as any).Telegram.WebApp.initDataUnsafe.user.photo_url);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
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
  }, [setMovies]);

  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    if (movies.length > 1) {
      const interval = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % movies.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [movies.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-600">
        <div className="animate-pulse flex items-center gap-2">
          <Play size={32} fill="currentColor" />
          <span className="font-bold tracking-widest uppercase">{t('loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/50 space-y-4">
        <p className="font-bold">{t('noContent', 'No content available')}</p>
        <button onClick={() => window.location.href = '/admin'} className="bg-red-600 px-4 py-2 rounded-lg text-white font-bold text-sm">
          {t('goToAdmin', 'Go to Admin Panel')}
        </button>
      </div>
    );
  }

  const featured = movies[featuredIndex] || movies[0];
  const trending = [...movies].sort((a, b) => b.views - a.views);
  const newReleases = [...movies].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] overflow-y-auto overflow-x-hidden pb-24 hide-scrollbar">
      {/* Header/App Bar */}
      <header className="sticky top-0 flex-none flex items-center justify-between p-4 sm:p-6 gap-2 z-40 bg-[#050505]/80 backdrop-blur-md max-w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(229,9,20,0.3)] shrink-0">
             <Play size={20} className="text-white ml-0.5 sm:size-[24px]" fill="currentColor" />
          </div>
          <h1 className="text-lg sm:text-2xl font-black tracking-tighter text-white truncate">DRAMA<span className="text-red-600">REEL</span></h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => navigate('/search')}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#1A1A1A] rounded-xl border border-white/5 text-white/70 hover:text-white transition-colors active:opacity-80 shrink-0"
          >
            <Search size={16} />
          </button>
          <TopPointsBadge />
          <button onClick={() => navigate('/profile')} className="active:opacity-80 transition-transform shrink-0">
            <img src={avatar} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-red-600/30 bg-[#1A1A1A] object-cover" alt="avatar" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {/* Hero / Featured */}
        <div className="px-6 relative h-[450px]">
          <div className="h-full w-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={featured.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <MovieCard movie={featured} featured />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Weekly Contest Banner */}
        <div className="px-6 -mt-5 -mb-6 z-10 relative">
          <button 
            onClick={() => navigate('/weekly-contest')}
            className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-2xl p-4 shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-between group"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10 text-black text-start">
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center backdrop-blur-sm shrink-0">
                <Trophy size={20} className="fill-black/80" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  {i18n.language === 'ar' ? 'المسابقة الأسبوعية للإحالات' : 'Weekly Referral Contest'}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold opacity-80 mt-0.5">
                  {i18n.language === 'ar' ? 'اربح باقات VIP مجاناً الآن!' : 'Win Free VIP Passes Now!'}
                </p>
              </div>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center backdrop-blur-sm shrink-0 relative z-10 text-black group-hover:bg-black/20 transition-colors">
              {i18n.language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>
        </div>

        {/* Trending Section */}
        <div className="py-2">
          <div className="px-6 flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white tracking-tight">{t('trendingToday')}</h3>
            <button onClick={() => navigate('/search')} className="text-red-600 text-xs font-bold hover:underline">{t('viewAll', 'View All')}</button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x hide-scrollbar">
            {trending.map(movie => (
              <div key={movie.id} className="snap-start shrink-0">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>

        {/* New Releases Section */}
        <div className="py-2">
          <div className="px-6 flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white tracking-tight">{t('newReleases')}</h3>
            <button onClick={() => navigate('/search')} className="text-red-600 text-xs font-bold hover:underline">{t('viewAll', 'View All')}</button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x hide-scrollbar">
            {newReleases.map(movie => (
              <div key={`new-${movie.id}`} className="snap-start shrink-0">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

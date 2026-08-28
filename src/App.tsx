import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { processReferral, getCurrentUserId, getTelegramUser } from './services/referralService';
import { syncCoinsToFirebase } from './services/userService';
import { useAppStore } from './store';

// Components
import { BottomNav } from './components/BottomNav';
import { HomeScreenTaskModal } from './components/HomeScreenTaskModal';

// Pages
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Favorites } from './pages/Favorites';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { MovieDetails } from './pages/MovieDetails';
import { Watch } from './pages/Watch';
import { Admin } from './pages/Admin';
import { ForYou } from './pages/ForYou';
import { WeeklyContest } from './pages/WeeklyContest';

// Initialization
import './i18n';

// Main App component
const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Don't show bottom nav on watch page or details or admin
  const showNav = !location.pathname.includes('/watch/') && !location.pathname.includes('/movie/') && !location.pathname.includes('/admin');

  return (
    <div 
      className="bg-[#050505] w-screen overflow-hidden text-[#E0E0E0] font-sans selection:bg-red-500/30 relative flex flex-col"
      style={{
        height: 'var(--tg-viewport-stable-height, 100vh)',
        paddingTop: 'var(--tg-safe-area-inset-top, env(safe-area-inset-top))',
        paddingBottom: 'var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom))',
        paddingLeft: 'var(--tg-safe-area-inset-left, env(safe-area-inset-left))',
        paddingRight: 'var(--tg-safe-area-inset-right, env(safe-area-inset-right))',
      }}
    >
      <div className="flex-1 w-full min-h-0 overflow-hidden relative">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/foryou" element={<ForYou />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/weekly-contest" element={<WeeklyContest />} />
          <Route path="/contest" element={<WeeklyContest />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </div>
  );
};

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [referralBonusToast, setReferralBonusToast] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const addCoins = useAppStore(s => s.addCoins);
  const coins = useAppStore(s => s.coins);

  useEffect(() => {
    if (userId) {
      const tgUser = getTelegramUser();
      const userName = tgUser?.first_name || 'مستخدم';
      syncCoinsToFirebase(userId, coins, userName);
    }
  }, [coins, userId]);

  useEffect(() => {
    // Disable copy on non-input elements
    const preventCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('copy', preventCopy);

    // Set theme based on Telegram settings or force dark
    document.documentElement.classList.add('dark');
    
    // Telegram Web App configurations
    if ((window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      if (typeof tg.requestFullscreen === 'function') {
        try {
          tg.requestFullscreen();
        } catch (e) {
          console.error("Telegram requestFullscreen error:", e);
        }
      }

      try {
        if (tg.setHeaderColor) tg.setHeaderColor('#050505');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#050505');
      } catch (e) {
        console.error("Telegram set color error:", e);
      }
    }
    
    signInAnonymously(auth).catch((err) => {
      console.warn("Auth anonymous signin warning:", err);
      setIsAuthReady(true);
    });

    // Fallback timeout to guarantee app loads even if auth is delayed
    const authTimeout = setTimeout(() => {
      setIsAuthReady(true);
    }, 1200);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(authTimeout);
      setIsAuthReady(true);
      if (user) {
        // Process potential referral deep link
        const currentId = getCurrentUserId(user.uid);
        setUserId(currentId);
        const tgUser = getTelegramUser();
        const userName = tgUser?.first_name || 'Friend';

        processReferral(currentId, userName).then((res) => {
          if (res && res.success) {
            addCoins(res.bonusCoins);
            setReferralBonusToast(res.bonusCoins);
            setTimeout(() => setReferralBonusToast(null), 5000);
          }
        }).catch(err => console.error("Referral process error:", err));
      }
    });

    return () => {
      clearTimeout(authTimeout);
      document.removeEventListener('copy', preventCopy);
      unsubscribe();
    };
  }, [addCoins]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-600 font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/60">Drama Reel Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes />

      {/* Welcome Referral Toast Notification */}
      {referralBonusToast && (
        <div className="fixed top-5 inset-x-4 z-[999] bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black p-4 rounded-2xl shadow-2xl border border-yellow-300 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-extrabold text-sm">مرحباً بك في Drama Reel!</div>
              <div className="text-xs font-medium">حصلت على +{referralBonusToast} نقطة مجانية من مكافأة الإحالة!</div>
            </div>
          </div>
          <button 
            onClick={() => setReferralBonusToast(null)}
            className="text-xs font-bold bg-black/20 px-2.5 py-1 rounded-lg"
          >
            x
          </button>
        </div>
      )}

      <HomeScreenTaskModal />
    </Router>
  );
}


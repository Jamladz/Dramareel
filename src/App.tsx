import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { processReferral, getCurrentUserId, getTelegramUser } from './services/referralService';
import { syncCoinsToFirebase, updateTelegramWriteAccess } from './services/userService';
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
import { Tasks } from './pages/Tasks';
import { WeeklyContest } from './pages/WeeklyContest';

// Initialization
import './i18n';

import { fetchMoviesFromDB } from './services/movieService';

// Main App component
const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const deepLinkProcessed = React.useRef(false);
  
  useEffect(() => {
    // Handle Telegram Deep Link for movies safely inside the router context
    if (deepLinkProcessed.current) return;
    deepLinkProcessed.current = true;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.start_param) {
      const startParam = tg.initDataUnsafe.start_param;
      if (startParam.startsWith('movie_')) {
        const parts = startParam.split('_');
        const movieId = parts[1];
        if (movieId) {
          // Avoid navigating if we are already on the movie page
          if (!window.location.pathname.startsWith('/movie/')) {
            navigate(`/movie/${movieId}`);
          }
        }
      }
    }
  }, [navigate]);

  // Don't show bottom nav on watch page or details or admin
  const showNav = !location.pathname.includes('/watch/') && !location.pathname.includes('/movie/') && !location.pathname.includes('/admin');

  return (
    <div 
      className="bg-[#070709] w-screen overflow-hidden text-[#F4F4F6] font-sans selection:bg-red-500/30 relative flex flex-col"
      style={{
        height: 'var(--tg-viewport-stable-height, 100vh)',
        paddingTop: 'calc(var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px)) + 28px)',
        paddingBottom: 'var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom))',
        paddingLeft: 'var(--tg-safe-area-inset-left, env(safe-area-inset-left))',
        paddingRight: 'var(--tg-safe-area-inset-right, env(safe-area-inset-right))',
      }}
    >
      <div className="flex-1 w-full min-h-0 overflow-hidden relative">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/tasks" element={<Tasks />} />
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
  const [moviesLoaded, setMoviesLoaded] = useState(false);
  const [referralBonusToast, setReferralBonusToast] = useState<number | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(() => getCurrentUserId());
  const [writeAccessGrantedState, setWriteAccessGrantedState] = useState<boolean>(() => {
    const tg = (window as any).Telegram?.WebApp;
    return Boolean(tg?.initDataUnsafe?.user?.allows_write_to_pm);
  });
  const writeAccessPromptedRef = React.useRef(false);
  const writeAccessHandledRef = React.useRef(false);

  const addCoins = useAppStore(s => s.addCoins);
  const coins = useAppStore(s => s.coins);
  const completedEpisodes = useAppStore(s => s.completedEpisodes);
  const setMovies = useAppStore(s => s.setMovies);

  // Global Data Fetch
  useEffect(() => {
    fetchMoviesFromDB().then((data) => {
      setMovies(data);
    }).catch(err => {
      console.error("Error fetching movies", err);
    }).finally(() => {
      setMoviesLoaded(true);
    });
  }, [setMovies]);

  useEffect(() => {
    if (userId) {
      const tgUser = getTelegramUser();
      const userName = tgUser?.first_name || 'مستخدم';
      const tg = (window as any).Telegram?.WebApp;
      const isAllowed = writeAccessGrantedState || Boolean(tg?.initDataUnsafe?.user?.allows_write_to_pm);
      syncCoinsToFirebase(userId, coins, userName, completedEpisodes, isAllowed ? true : undefined);
    }
  }, [coins, userId, completedEpisodes, writeAccessGrantedState]);

  // Official Telegram Write Access (Notifications) automatic prompt once app UI is ready
  useEffect(() => {
    if (!isAuthReady || !moviesLoaded) return;
    if (writeAccessPromptedRef.current) return;
    writeAccessPromptedRef.current = true;

    // Clear any legacy localStorage flag that previously blocked the official Telegram popup
    try {
      localStorage.removeItem('dramareel_write_access_requested');
    } catch (e) {
      // Ignore storage errors
    }

    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    const currentId = userId || getCurrentUserId(auth.currentUser?.uid);
    const alreadyAllowedInInitData = Boolean(tg.initDataUnsafe?.user?.allows_write_to_pm);

    const handleWriteAccessDecision = (allowed: boolean) => {
      if (writeAccessHandledRef.current && allowed === writeAccessGrantedState) return;
      writeAccessHandledRef.current = true;

      const resolvedUserId = currentId || getCurrentUserId(auth.currentUser?.uid);
      if (allowed) {
        setWriteAccessGrantedState(true);
        if (resolvedUserId) {
          updateTelegramWriteAccess(resolvedUserId, 'allowed', true).then((res) => {
            if (res.success && res.rewarded) {
              addCoins(100, 'تفعيل إشعارات تيليجرام');
              setNotificationToast('🔔 تم تفعيل الإشعارات بنجاح! حصلت على +100 نقطة مجانية');
              setTimeout(() => setNotificationToast(null), 4500);
            }
          }).catch(err => {
            console.error("Error updating allowed write access:", err);
          });
        }
      } else {
        if (resolvedUserId) {
          updateTelegramWriteAccess(resolvedUserId, 'denied', false).catch(err => {
            console.error("Error updating denied write access:", err);
          });
        }
      }
    };

    if (alreadyAllowedInInitData) {
      handleWriteAccessDecision(true);
      return;
    }

    // Listen for official Telegram writeAccessRequested event
    const onWriteAccessEvent = (eventData: any) => {
      if (eventData?.status === 'allowed') {
        handleWriteAccessDecision(true);
      } else if (eventData?.status === 'cancelled') {
        handleWriteAccessDecision(false);
      }
    };

    if (typeof tg.onEvent === 'function') {
      tg.onEvent('writeAccessRequested', onWriteAccessEvent);
    }

    // Automatically trigger the official Telegram permission popup
    const promptTimer = setTimeout(() => {
      try {
        if (typeof tg.requestWriteAccess === 'function') {
          tg.requestWriteAccess((allowed: boolean) => {
            handleWriteAccessDecision(Boolean(allowed));
          });
        }
      } catch (err) {
        console.warn("Official Telegram requestWriteAccess failed:", err);
      }
    }, 700);

    return () => {
      clearTimeout(promptTimer);
      if (typeof tg.offEvent === 'function') {
        tg.offEvent('writeAccessRequested', onWriteAccessEvent);
      }
    };
  }, [isAuthReady, moviesLoaded, userId, addCoins, writeAccessGrantedState]);

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
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) {
            tg.requestFullscreen();
          }
        } catch (e) {
          // Suppress error on unsupported clients
        }
      }

      try {
        if (tg.setHeaderColor) tg.setHeaderColor('#070709');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#070709');
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
      const currentId = getCurrentUserId(user?.uid);
      setUserId(currentId);

      if (currentId) {
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

  if (!isAuthReady || !moviesLoaded) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-red-600 font-bold">
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-11 h-11 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(229,9,20,0.4)]" />
          <span className="text-xs font-extrabold tracking-widest uppercase text-white/60">DRAMA REEL</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes />

      {/* Official Telegram Notification Enabled Toast */}
      {notificationToast && (
        <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-[999] bg-[#121217]/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm">🔔</span>
            <div className="text-xs font-extrabold text-emerald-300">{notificationToast}</div>
          </div>
          <button 
            onClick={() => setNotificationToast(null)}
            className="text-xs font-black bg-white/10 px-2.5 py-1 rounded-lg text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Welcome Referral Toast Notification */}
      {referralBonusToast && (
        <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-[999] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black p-4 rounded-2xl shadow-2xl border border-yellow-200 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-black text-sm">مرحباً بك في Drama Reel!</div>
              <div className="text-xs font-bold">حصلت على +{referralBonusToast} نقطة مجانية من مكافأة الإحالة!</div>
            </div>
          </div>
          <button 
            onClick={() => setReferralBonusToast(null)}
            className="text-xs font-black bg-black/20 px-2.5 py-1 rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      <HomeScreenTaskModal />
    </Router>
  );
}



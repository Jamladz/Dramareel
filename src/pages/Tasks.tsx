import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Tv, CheckCircle, Clock, Share2, Flame, Coins, Globe, Bell, Smartphone, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { getUserData, claimMonetagReward, claimSiteVisitReward, claimRewardAd, getTaskStatus, completeTelegramTask, updateTelegramWriteAccess } from '../services/userService';
import { getCurrentUserId } from '../services/referralService';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';
import { ReferralHub } from '../components/ReferralHub';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { AnimatePresence, motion } from 'motion/react';

export const Tasks = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const { 
    coins, 
    lastDailyReward, 
    claimDailyReward, 
    claimAdReward, 
    hasJoinedTelegram, 
    setJoinedTelegram, 
    streakDays,
    addCoins,
  } = useAppStore();

  // Toast feedback state instead of window.alert
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Monetag State
  const [isMonetagLoading, setIsMonetagLoading] = useState(false);
  const [lastMonetagClaim, setLastMonetagClaim] = useState<number>(0);
  const [monetagTimeLeft, setMonetagTimeLeft] = useState<string | null>(null);
  const MONETAG_COOLDOWN_MS = 5 * 60 * 1000;

  // Adsgram Daily Reward Ad State (20/day)
  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  // Site Visit State
  const [isSiteVisitLoading, setIsSiteVisitLoading] = useState(false);
  const [isHomeScreenLoading, setIsHomeScreenLoading] = useState(false);
  const [isHomeScreenAdded, setIsHomeScreenAdded] = useState(false);
  const [lastSiteVisitClaim, setLastSiteVisitClaim] = useState<number>(0);
  const [siteVisitTimeLeft, setSiteVisitTimeLeft] = useState<string | null>(null);
  const SITE_VISIT_COOLDOWN_MS = 5 * 60 * 1000;

  // Daily Streak State
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [dailyTimeLeft, setDailyTimeLeft] = useState<string>('');
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(true);

  // Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Telegram Write Access State
  const [telegramWriteAccessStatus, setTelegramWriteAccessStatus] = useState<'allowed' | 'denied' | 'unknown'>('unknown');
  const [isWriteAccessCompleted, setIsWriteAccessCompleted] = useState(false);
  const [isWriteAccessLoading, setIsWriteAccessLoading] = useState(false);

  const streakRewards = [50, 70, 100, 120, 150, 200, 300];

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const data = await getUserData(uid);
        if (data) {
          if (data.lastMonetagClaim) {
            setLastMonetagClaim(Number(data.lastMonetagClaim) || 0);
          }
          if (data.lastSiteVisitClaim) {
            setLastSiteVisitClaim(Number(data.lastSiteVisitClaim) || 0);
          }
          if (data.homeScreenAdded) {
            setIsHomeScreenAdded(true);
          }
          const todayStr = new Date().toISOString().split('T')[0];
          if (data.dailyAdsDate === todayStr) {
            setAdsWatchedCount(data.adsWatchedToday || 0);
          } else {
            setAdsWatchedCount(0);
          }
          if (data.telegramWriteAccessStatus) {
            setTelegramWriteAccessStatus(data.telegramWriteAccessStatus);
          }
        }
        
        const hasJoined = await getTaskStatus(uid, 'join_channel');
        if (hasJoined && !hasJoinedTelegram) {
           setJoinedTelegram();
        }

        const writeAccessTask = await getTaskStatus(uid, 'telegram_write_access');
        setIsWriteAccessCompleted(writeAccessTask);
      }
    };
    fetchUserData();
  }, []);

  // Monetag Timer
  useEffect(() => {
    if (!lastMonetagClaim) {
      setMonetagTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = MONETAG_COOLDOWN_MS - (now - lastMonetagClaim);
      
      if (diff <= 0) {
        setMonetagTimeLeft(null);
        setLastMonetagClaim(0);
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setMonetagTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastMonetagClaim]);

  // Site Visit Timer
  useEffect(() => {
    if (!lastSiteVisitClaim) {
      setSiteVisitTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = SITE_VISIT_COOLDOWN_MS - (now - lastSiteVisitClaim);
      
      if (diff <= 0) {
        setSiteVisitTimeLeft(null);
        setLastSiteVisitClaim(0);
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setSiteVisitTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSiteVisitClaim]);

  // Daily Streak Timer
  useEffect(() => {
    const updateCountdown = () => {
      if (!lastDailyReward) {
        setCanClaimDaily(true);
        setDailyTimeLeft('');
        return;
      }
      const oneDayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const timeSinceLast = now - lastDailyReward;
      const remaining = oneDayMs - timeSinceLast;
      if (remaining <= 0) {
        setCanClaimDaily(true);
        setDailyTimeLeft('');
      } else {
        setCanClaimDaily(false);
        const h = Math.floor(remaining / (1000 * 60 * 60));
        const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((remaining % (1000 * 60)) / 1000);
        setDailyTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastDailyReward]);

  const handleMonetagClaim = () => {
    if (isMonetagLoading || monetagTimeLeft) return;
    
    setIsMonetagLoading(true);
    const uid = getCurrentUserId();
    
    if (typeof window !== 'undefined' && (window as any).show_11695307) {
      (window as any).show_11695307().then(async () => {
        try {
          const data = await claimMonetagReward(uid);
          if (data.success) {
            useAppStore.getState().addCoins(30, isArabic ? 'إعلانات A' : 'Ads A');
            setLastMonetagClaim(data.lastClaim!);
            showToast(isArabic ? 'حصلت على +30 نقطة بنجاح!' : 'You earned +30 points!', 'success');
          } else {
             if (data.remainingMs) {
                setLastMonetagClaim(Date.now() - (MONETAG_COOLDOWN_MS - data.remainingMs));
             }
             showToast(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet', 'info');
          }
        } catch (e) {
          console.error("Claim error:", e);
        } finally {
          setIsMonetagLoading(false);
        }
      }).catch((e: any) => {
        console.log("Monetag error:", e);
        setIsMonetagLoading(false);
      });
    } else {
      console.warn("Monetag script not loaded");
      showToast(isArabic ? 'حدث خطأ في تحميل الإعلان، يرجى المحاولة لاحقاً' : 'Ad failed to load. Please try again later.', 'info');
      setIsMonetagLoading(false);
    }
  };

  const handleHomeScreenAdd = () => {
    if (isHomeScreenLoading || isHomeScreenAdded) return;
    useAppStore.getState().openHomeScreenModal();
  };

  const handleSiteVisit = () => {
    if (isSiteVisitLoading || siteVisitTimeLeft) return;
    setIsSiteVisitLoading(true);
    
    window.open('https://omg10.com/4/11695668', '_blank');
    
    setTimeout(async () => {
      const uid = getCurrentUserId();
      if (!uid) {
        setIsSiteVisitLoading(false);
        return;
      }
      
      try {
        const data = await claimSiteVisitReward(uid);
        if (data.success) {
          useAppStore.getState().addCoins(20, isArabic ? 'زيارة الموقع' : 'Visit Website');
          setLastSiteVisitClaim(data.lastClaim!);
          showToast(isArabic ? 'حصلت على +20 نقطة لزيارة الموقع!' : 'Earned +20 points for visiting!', 'success');
        } else {
           if (data.remainingMs) {
              setLastSiteVisitClaim(Date.now() - (SITE_VISIT_COOLDOWN_MS - data.remainingMs));
           }
           showToast(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet', 'info');
        }
      } catch (e) {
        console.error("Site visit claim error:", e);
        showToast(isArabic ? 'حدث خطأ. يرجى المحاولة لاحقاً.' : 'Error occurred. Please try again later.', 'info');
      } finally {
        setIsSiteVisitLoading(false);
      }
    }, 5000);
  };

  const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      showToast(isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.', 'info');
      return;
    }
    setIsRewardAdLoading(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.REWARD_AD);
      if (success) {
        const uid = getCurrentUserId();
        if (uid) {
           const res = await claimRewardAd(uid);
           if (res.success && res.newTotal !== undefined) {
             useAppStore.getState().setCoinsFromServer(res.newTotal);
             setAdsWatchedCount(res.adsWatchedToday || 0);
             showToast(isArabic ? 'تمت إضافة +30 نقطة إلى رصيدك!' : 'Added +30 points!', 'success');
           } else {
             showToast(res.error || (isArabic ? 'حدث خطأ' : 'Error'), 'info');
           }
        }
      }
    } catch (err) {
      console.error('Reward ad error:', err);
    } finally {
      setIsRewardAdLoading(false);
    }
  };

  const handleClaimDailyWithAd = async () => {
    if (!canClaimDaily) return;
    setIsClaimingDaily(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.DAILY_STREAK);
      if (success) {
        const res = claimDailyReward();
        if (res.success) {
          showToast(isArabic ? `تهانينا! استلمت مكافأة اليوم ${res.streak}: +${res.reward} نقطة!` : `Claimed Day ${res.streak} reward: +${res.reward} coins!`, 'success');
        } else {
          showToast(isArabic ? 'لقد قمت باستلام مكافأتك اليومية بالفعل. عد غداً!' : 'Already claimed today! Come back tomorrow.', 'info');
        }
      }
    } catch (err) {
      console.error('Error claiming daily reward with ad:', err);
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const handleJoinTelegram = () => {
    if (hasJoinedTelegram) return;
    window.open('https://t.me/dramareel2026', '_blank');
    
    setTimeout(async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const res = await completeTelegramTask(uid, 'join_channel', 100);
        if (res.success) {
          setJoinedTelegram();
          addCoins(100, 'انضمام لقناة التلجرام');
          showToast(isArabic ? 'تم إكمال المهمة وحصلت على +100 نقطة!' : 'Task completed! +100 points!', 'success');
        } else {
          if (res.error === 'Task already completed') {
            setJoinedTelegram();
            showToast(isArabic ? 'لقد أكملت هذه المهمة مسبقاً' : 'Task already completed', 'info');
          }
        }
      } else {
         setJoinedTelegram();
         addCoins(100, 'انضمام لقناة التلجرام');
      }
    }, 5000);
  };

  const handleTelegramWriteAccess = () => {
    if (isWriteAccessLoading || isWriteAccessCompleted) return;
    setIsWriteAccessLoading(true);

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.requestWriteAccess) {
      try {
        tg.requestWriteAccess(async (allowed: boolean) => {
          const status = allowed ? 'allowed' : 'denied';
          const uid = getCurrentUserId();
          if (uid) {
            const res = await updateTelegramWriteAccess(uid, status, true);
            if (res.success) {
              setTelegramWriteAccessStatus(status);
              if (res.rewarded) {
                setIsWriteAccessCompleted(true);
                addCoins(100, isArabic ? 'تفعيل إشعارات تيليجرام' : 'Enable Telegram Notifications');
                showToast(isArabic ? 'تم تفعيل الإشعارات وحصلت على +100 نقطة!' : 'Notifications enabled! +100 points!', 'success');
              } else {
                showToast(isArabic ? 'تم تفعيل الإشعارات بنجاح!' : 'Notifications enabled!', 'success');
              }
            }
          }
          setIsWriteAccessLoading(false);
        });
      } catch (e) {
        console.error("Write access error:", e);
        setIsWriteAccessLoading(false);
      }
    } else {
      const uid = getCurrentUserId();
      if (uid) {
        setTimeout(async () => {
          const res = await updateTelegramWriteAccess(uid, 'allowed', true);
          if (res.success) {
            setTelegramWriteAccessStatus('allowed');
            if (res.rewarded) {
              setIsWriteAccessCompleted(true);
              addCoins(100, isArabic ? 'تفعيل إشعارات تيليجرام' : 'Enable Telegram Notifications');
              showToast(isArabic ? 'تم تفعيل الإشعارات وحصلت على +100 نقطة!' : 'Notifications enabled! +100 points!', 'success');
            }
          }
          setIsWriteAccessLoading(false);
        }, 1000);
      } else {
        setIsWriteAccessLoading(false);
      }
    }
  };

  const TaskItem = ({ 
    icon, 
    title, 
    subtitle, 
    reward, 
    actionText, 
    onAction, 
    disabled, 
    loading, 
    completed,
    timer,
    accent = 'red'
  }: any) => (
    <div className="bg-[#121217] hover:bg-[#16161D] border border-white/[0.07] p-4 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-none border ${
          completed 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
            : accent === 'amber'
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            : 'bg-red-500/15 border-red-500/30 text-red-500'
        }`}>
          {completed ? <CheckCircle size={20} /> : icon}
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="font-extrabold text-sm text-white truncate max-w-full">{title}</span>
          {subtitle && <span className="text-xs text-white/50 truncate max-w-full">{subtitle}</span>}
        </div>
      </div>
      
      <div className="flex items-center gap-2.5 shrink-0">
        {!completed && reward && (
          <div className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl tabular-nums" dir="ltr">
            <Coins size={12} className="text-amber-400" />
            <span>+{reward}</span>
          </div>
        )}
        <button 
          onClick={onAction}
          disabled={disabled || completed || loading}
          className={`px-4 min-h-[40px] rounded-xl text-xs font-extrabold transition-all whitespace-nowrap min-w-[76px] flex justify-center items-center ${
            completed 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
              : disabled && !timer
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : timer
              ? 'bg-white/5 text-white/60 border border-white/10 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-md shadow-red-600/20 active:scale-95'
          }`}
        >
          {loading ? (isArabic ? 'جاري...' : 'Wait...') : timer ? <span className="font-mono tabular-nums text-[11px]">{timer}</span> : completed ? (isArabic ? 'مكتمل' : 'Done') : actionText}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070709] text-white pb-32 hide-scrollbar" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 inset-x-4 max-w-md mx-auto z-[200] p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-2.5 text-xs font-extrabold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/90 border-amber-500/40 text-amber-300'
            }`}
          >
            <Sparkles size={16} className="shrink-0" />
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#070709]/85 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <Gift size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {isArabic ? 'مركز المهام والمكافآت' : 'Rewards & Tasks Center'}
              </h2>
              <p className="text-[11px] text-white/45">
                {isArabic ? 'اجمع النقاط واستبدلها بمشاهدة مجانية وباقات VIP' : 'Earn free coins & redeem for VIP passes'}
              </p>
            </div>
          </div>
          <TopPointsBadge showEarnButton={false} />
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        
        {/* 7-Day Daily Streak Highlight Card */}
        <div className="bg-gradient-to-br from-[#231B0E] via-[#16130E] to-[#101014] border border-amber-500/30 rounded-3xl p-5 relative overflow-hidden shadow-[0_12px_35px_rgba(245,158,11,0.1)]">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold mb-1.5">
                  <Flame size={12} className="fill-amber-400 text-amber-400" />
                  <span>{isArabic ? `سلسلة ${streakDays} أيام متتالية` : `${streakDays} Days Streak`}</span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-white">
                  {isArabic ? 'مكافأة الحضور اليومي' : 'Daily Check-In Bonus'}
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-400/90 tabular-nums">
                {isArabic ? 'تصل إلى +300 نقطة' : 'Up to +300 pts'}
              </span>
            </div>

            {/* 7-Day Visual Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {streakRewards.map((reward, index) => {
                const dayNum = index + 1;
                const isClaimed = streakDays >= dayNum;
                const isCurrent = streakDays + 1 === dayNum;

                return (
                  <div 
                    key={index} 
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border text-center transition-all ${
                      isClaimed 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                        : isCurrent
                        ? 'bg-gradient-to-b from-amber-500/30 to-amber-500/10 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-black/40 border-white/5 text-white/35'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase mb-1">
                      {isArabic ? `يوم ${dayNum}` : `D${dayNum}`}
                    </span>
                    <span className="text-xs font-black tabular-nums" dir="ltr">+{reward}</span>
                  </div>
                );
              })}
            </div>
             
            <button 
              onClick={handleClaimDailyWithAd}
              disabled={isClaimingDaily || !canClaimDaily}
              className={`w-full min-h-[48px] font-black text-xs sm:text-sm py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                canClaimDaily 
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black active:scale-98 shadow-amber-500/20'
                  : 'bg-white/[0.06] text-white/50 cursor-not-allowed border border-white/10'
              }`}
            >
              {isClaimingDaily ? (
                <span>{isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...'}</span>
              ) : !canClaimDaily ? (
                <span className="flex items-center gap-2">
                  <Clock size={15} /> 
                  <span>{isArabic ? 'المكافأة القادمة بعد:' : 'Next reward in:'}</span>
                  <span className="font-mono tabular-nums text-amber-400" dir="ltr">{dailyTimeLeft}</span>
                </span>
              ) : (
                <>
                  <Gift size={17} />
                  <span>{isArabic ? 'استلام مكافأة اليوم (مشاهدة إعلان)' : 'Claim Daily Bonus (Watch Ad)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Video Ad Tasks */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs text-white/55 font-extrabold uppercase tracking-wider">
              {isArabic ? 'مكافآت الإعلانات السريعة' : 'Quick Video Rewards'}
            </h3>
            <span className="text-[11px] text-white/40 font-mono tabular-nums">
              {adsWatchedCount}/{DAILY_AD_LIMIT} {isArabic ? 'اليوم' : 'today'}
            </span>
          </div>

          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'مشاهدة إعلان مكافأة (A)' : 'Watch Reward Ad (A)'}
            subtitle={isArabic ? 'متاح كل 5 دقائق لربح نقاط فورية' : 'Available every 5 minutes'}
            reward="30"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleMonetagClaim}
            disabled={!!monetagTimeLeft}
            loading={isMonetagLoading}
            completed={false}
            timer={monetagTimeLeft}
          />

          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'مشاهدة إعلان مكافأة (B)' : 'Watch Reward Ad (B)'}
            subtitle={`${adsWatchedCount}/${DAILY_AD_LIMIT} ${isArabic ? 'متاح يومياً' : 'Daily limit'}`}
            reward="30"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleRewardAd}
            disabled={adsWatchedCount >= DAILY_AD_LIMIT}
            loading={isRewardAdLoading}
            completed={adsWatchedCount >= DAILY_AD_LIMIT}
          />
        </div>

        {/* Social & App Tasks */}
        <div className="space-y-2.5">
          <h3 className="text-xs text-white/55 font-extrabold uppercase tracking-wider px-1">
            {isArabic ? 'مهام التطبيق والمجتمع' : 'Community & App Tasks'}
          </h3>

          <TaskItem 
            icon={<Share2 size={20} />}
            title={isArabic ? 'دعوة الأصدقاء للتطبيق' : 'Invite Friends'}
            subtitle={isArabic ? 'اربح 250 نقطة عن كل صديق ينضم عبر رابطك' : 'Earn 250 coins for every friend invited'}
            reward="250"
            actionText={isArabic ? 'دعوة' : 'Invite'}
            onAction={() => setShowReferralModal(true)}
            completed={false}
            accent="amber"
          />

          <TaskItem 
            icon={<Smartphone size={20} />}
            title={isArabic ? 'إضافة التطبيق للشاشة الرئيسية' : 'Add to Home Screen'}
            subtitle={isArabic ? 'مكافأة فورية للوصول السريع' : 'One-time shortcut reward'}
            reward="100"
            actionText={isArabic ? 'إضافة' : 'Add'}
            onAction={handleHomeScreenAdd}
            disabled={isHomeScreenAdded}
            loading={isHomeScreenLoading}
            completed={isHomeScreenAdded}
          />

          <TaskItem 
            icon={<Globe size={20} />}
            title={isArabic ? 'زيارة موقع الراعي' : 'Visit Sponsor Website'}
            subtitle={isArabic ? 'متاح كل 5 دقائق' : 'Available every 5 mins'}
            reward="20"
            actionText={isArabic ? 'زيارة' : 'Visit'}
            onAction={handleSiteVisit}
            disabled={!!siteVisitTimeLeft}
            loading={isSiteVisitLoading}
            completed={false}
            timer={siteVisitTimeLeft}
          />

          <TaskItem 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            }
            title={isArabic ? 'الانضمام لقناة تيليجرام الرسمية' : 'Join Official Telegram Channel'}
            subtitle={isArabic ? 'تابع أحدث المسلسلات الحصرية والعروض' : 'Stay updated with new drama releases'}
            reward="100"
            actionText={isArabic ? 'انضمام' : 'Join'}
            onAction={handleJoinTelegram}
            completed={hasJoinedTelegram}
          />

          <TaskItem 
            icon={<Bell size={20} />}
            title={isArabic ? 'تفعيل إشعارات المسلسلات الجديدة' : 'Enable New Drama Notifications'}
            subtitle={isArabic ? 'احصل على تنبيه فور نزول حلقات جديدة' : 'Get notified of new episodes on Telegram'}
            reward="100"
            actionText={isArabic ? 'تفعيل' : 'Enable'}
            onAction={handleTelegramWriteAccess}
            loading={isWriteAccessLoading}
            completed={isWriteAccessCompleted || telegramWriteAccessStatus === 'allowed'}
          />
        </div>
      </div>
      
      <ReferralHub 
        isOpen={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
      />
    </div>
  );
};


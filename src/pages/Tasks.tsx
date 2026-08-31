import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Tv, CheckCircle, Clock, Film, Users, Share2, Flame, Coins, Globe } from 'lucide-react';
import { useAppStore } from '../store';
import { getUserData } from '../services/userService';
import { getCurrentUserId } from '../services/referralService';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';
import { ReferralHub } from '../components/ReferralHub';

export const Tasks = () => {
  const { t, i18n } = useTranslation();
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
    
    getTotalCoinsEarned
  } = useAppStore();

  // Monetag State
  const [isMonetagLoading, setIsMonetagLoading] = useState(false);
  const [lastMonetagClaim, setLastMonetagClaim] = useState<number>(0);
  const [monetagTimeLeft, setMonetagTimeLeft] = useState<string | null>(null);
  const MONETAG_COOLDOWN_MS = 24 * 60 * 60 * 1000;

  // Adsgram Daily Reward Ad State (20/day)
  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  
  // Site Visit State
  const [isSiteVisitLoading, setIsSiteVisitLoading] = useState(false);
  const [lastSiteVisitClaim, setLastSiteVisitClaim] = useState<number>(0);
  const [siteVisitTimeLeft, setSiteVisitTimeLeft] = useState<string | null>(null);
  const SITE_VISIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

  // Adsgram general Watch Ad State
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Daily Streak State
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [dailyTimeLeft, setDailyTimeLeft] = useState<string>('');
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(true);

  // Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);

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
          const todayStr = new Date().toISOString().split('T')[0];
          if (data.dailyAdsDate === todayStr) {
            setAdsWatchedCount(data.adsWatchedToday || 0);
          } else {
            setAdsWatchedCount(0);
          }
        }
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
          const res = await fetch('/api/monetag/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid: uid })
          });
          const data = await res.json();
          if (data.success) {
            useAppStore.getState().setCoinsFromServer(data.newTotal);
            setLastMonetagClaim(data.lastClaim);
            alert(isArabic ? '🎉 حصلت على 100 نقطة' : '🎉 You got 100 points');
          } else {
             if (data.remainingMs) {
                setLastMonetagClaim(Date.now() - (MONETAG_COOLDOWN_MS - data.remainingMs));
             }
             alert(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet');
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
      alert(isArabic ? 'حدث خطأ في تحميل الإعلان، يرجى إيقاف مانع الإعلانات أو المحاولة لاحقاً.' : 'Ad failed to load. Please disable adblocker or try again later.');
      setIsMonetagLoading(false);
    }
  };

  
  const handleSiteVisit = () => {
    if (isSiteVisitLoading || siteVisitTimeLeft) return;
    setIsSiteVisitLoading(true);
    
    // Open the website in a new tab
    window.open('https://omg10.com/4/11695668', '_blank');
    
    // Add a 5 second delay to simulate user waiting/visiting the site before claiming
    setTimeout(async () => {
      const uid = getCurrentUserId();
      if (!uid) {
        setIsSiteVisitLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/visit/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid: uid })
        });
        const data = await res.json();
        
        if (data.success) {
          useAppStore.getState().setCoinsFromServer(data.newTotal);
          setLastSiteVisitClaim(data.lastClaim);
          alert(isArabic ? '🎉 حصلت على 50 نقطة لزيارة الموقع' : '🎉 You got 50 points for visiting');
        } else {
           if (data.remainingMs) {
              setLastSiteVisitClaim(Date.now() - (SITE_VISIT_COOLDOWN_MS - data.remainingMs));
           }
           alert(isArabic ? 'لم يحن وقت المكافأة بعد' : 'Reward not ready yet');
        }
      } catch (e) {
        console.error("Site visit claim error:", e);
        alert(isArabic ? 'حدث خطأ. يرجى المحاولة لاحقاً.' : 'Error occurred. Please try again later.');
      } finally {
        setIsSiteVisitLoading(false);
      }
    }, 5000);
  };

  const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      alert(isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.');
      return;
    }
    setIsRewardAdLoading(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.REWARD_AD);
      if (success) {
        await new Promise(r => setTimeout(r, 2500));
        const uid = getCurrentUserId();
        if (uid) {
          const data = await getUserData(uid);
          if (data && data.coins > coins) {
             useAppStore.getState().setCoinsFromServer(data.coins);
             const todayStr = new Date().toISOString().split('T')[0];
             if (data.dailyAdsDate === todayStr) {
               setAdsWatchedCount(data.adsWatchedToday || 0);
             }
             alert(isArabic ? 'تمت إضافة 100 نقطة 🎉' : 'Added 100 points 🎉');
          } else {
             alert(isArabic ? 'يبدو أن تأكيد المكافأة قد تأخر. سيتم التحديث قريباً.' : 'Reward confirmation delayed. Will update soon.');
          }
        }
      }
    } catch (err) {
      console.error('Reward ad error:', err);
    } finally {
      setIsRewardAdLoading(false);
    }
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.WATCH_AD);
      if (success) {
        if (claimAdReward()) {
          alert(isArabic ? '🎉 شكراً لمشاهدتك الإعلان! تمت إضافة +30 نقطة لرصيدك!' : '🎉 Thanks for watching! +30 Coins added!');
        } else {
          alert(isArabic ? 'الرجاء الانتظار 3 دقائق قبل مشاهدة إعلان آخر.' : 'Please wait 3 minutes before watching another ad.');
        }
      }
    } catch (err) {
      console.error('Watch ad error:', err);
    } finally {
      setIsWatchingAd(false);
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
          alert(isArabic ? `🎉 تهانينا! استلمت مكافأة اليوم ${res.streak}: +${res.reward} نقطة!` : `🎉 Congratulations! Claimed Day ${res.streak} reward: +${res.reward} coins!`);
        } else {
          alert(isArabic ? 'لقد قمت باستلام مكافأتك اليومية بالفعل. عد غداً!' : 'Already claimed today! Come back tomorrow.');
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
    setTimeout(() => {
      setJoinedTelegram();
      addCoins(100, 'انضمام لقناة التلجرام');
    }, 2000);
  };

  // Modern clean task item component
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
    timer 
  }: any) => (
    <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all group">
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-none ${completed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {completed ? <CheckCircle size={20} /> : icon}
        </div>
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-bold text-sm text-white">{title}</span>
          {subtitle && <span className="text-[11px] text-white/50">{subtitle}</span>}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!completed && reward && (
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md" dir="ltr">+{reward}</span>
        )}
        <button 
          onClick={onAction}
          disabled={disabled || completed || loading}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-w-[70px] flex justify-center items-center ${
            completed 
              ? 'bg-white/5 text-white/40 cursor-not-allowed'
              : disabled && !timer
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/15 text-white active:scale-95'
          }`}
        >
          {loading ? (isArabic ? 'جاري...' : 'Wait...') : timer ? <span className="font-mono">{timer}</span> : completed ? (isArabic ? 'مكتمل' : 'Done') : actionText}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#050505] text-white pb-32" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Gift className="text-red-500" />
            {isArabic ? 'المهام والمكافآت' : 'Tasks & Rewards'}
          </h2>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Coins size={16} className="text-yellow-400" />
            <span className="font-bold font-mono text-sm">{coins}</span>
          </div>
        </div>

        {/* Daily Streak Highlight */}
        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl">
            <Flame size={100} className="text-amber-500" />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
             <div className="flex justify-between items-start">
               <div className="flex flex-col gap-1">
                 <h3 className="font-black text-lg text-amber-400 flex items-center gap-2">
                   <Flame size={20} />
                   {isArabic ? 'المكافأة اليومية' : 'Daily Streak'}
                 </h3>
                 <p className="text-xs text-white/60">
                   {isArabic ? `لقد سجلت الدخول ${streakDays} أيام متتالية` : `You logged in for ${streakDays} consecutive days`}
                 </p>
               </div>
             </div>
             
             <button 
                onClick={handleClaimDailyWithAd}
                disabled={isClaimingDaily || !canClaimDaily}
                className={`w-full font-black text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  canClaimDaily 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black active:scale-95'
                    : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/5'
                }`}
              >
                {isClaimingDaily ? (
                  <span>{isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...'}</span>
                ) : !canClaimDaily ? (
                  <span className="flex items-center gap-2">
                    <Clock size={16} /> 
                    {isArabic ? 'متاح بعد:' : 'Available in:'} <span dir="ltr">{dailyTimeLeft}</span>
                  </span>
                ) : (
                  <span>{isArabic ? 'استلام المكافأة (إعلان)' : 'Claim Reward (Ad)'}</span>
                )}
              </button>
          </div>
        </div>

        {/* Monetag Tasks */}
        <div className="space-y-3">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'إعلانات A' : 'Ads A'}
          </h3>
          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'شاهد إعلان A' : 'Watch Ad A'}
            subtitle={isArabic ? 'متاح مرة كل 24 ساعة' : 'Available once every 24h'}
            reward="100"
            actionText={isArabic ? 'مطالبة' : 'Claim'}
            onAction={handleMonetagClaim}
            disabled={!!monetagTimeLeft}
            loading={isMonetagLoading}
            completed={false}
            timer={monetagTimeLeft}
          />
        </div>

        {/* Adsgram Tasks */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'إعلانات B' : 'Ads B'}
          </h3>
          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'مكافأة إعلان B' : 'Ad B Reward'}
            subtitle={`${adsWatchedCount}/${DAILY_AD_LIMIT} ${isArabic ? 'يومياً' : 'Daily'}`}
            reward="100"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleRewardAd}
            disabled={adsWatchedCount >= DAILY_AD_LIMIT}
            loading={isRewardAdLoading}
            completed={adsWatchedCount >= DAILY_AD_LIMIT}
          />

          <TaskItem 
            icon={<Film size={20} />}
            title={isArabic ? 'مشاهدة إعلان سريع' : 'Watch Quick Ad'}
            subtitle={isArabic ? 'متاح باستمرار' : 'Always available'}
            reward="30"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleWatchAd}
            disabled={isWatchingAd}
            loading={isWatchingAd}
            completed={false}
          />
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'مهام أخرى' : 'Other Tasks'}
          </h3>
          <TaskItem 
            icon={<Globe size={20} />}
            title={isArabic ? 'زيارة الموقع' : 'Visit Website'}
            subtitle={isArabic ? 'متاح مرة كل 24 ساعة' : 'Available once every 24h'}
            reward="50"
            actionText={isArabic ? 'زيارة' : 'Visit'}
            onAction={handleSiteVisit}
            disabled={!!siteVisitTimeLeft}
            loading={isSiteVisitLoading}
            completed={false}
            timer={siteVisitTimeLeft}
          />


          <TaskItem 
            icon={<Share2 size={20} />}
            title={isArabic ? 'دعوة أصدقاء' : 'Invite Friends'}
            subtitle={isArabic ? 'احصل على مكافأة لكل صديق' : 'Get rewarded per friend'}
            reward="250"
            actionText={isArabic ? 'دعوة' : 'Invite'}
            onAction={() => setShowReferralModal(true)}
            completed={false}
          />

          <TaskItem 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            }
            title={isArabic ? 'انضم لقناة التلجرام' : 'Join Telegram Channel'}
            reward="100"
            actionText={isArabic ? 'انضمام' : 'Join'}
            onAction={handleJoinTelegram}
            completed={hasJoinedTelegram}
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

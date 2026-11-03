import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, Film, Tv, Flame, Gift, Settings, Crown, Share2, Wallet, User, Users, Sparkles, History, ShoppingBag, ArrowUpRight, ArrowDownRight, Bell, Globe } from 'lucide-react';
import { useAppStore } from '../store';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { ReferralHub } from '../components/ReferralHub';
import { PointsStoreModal } from '../components/PointsStoreModal';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { TonPaymentModal } from '../components/TonPaymentModal';
import { TON_CONFIG } from '../config/tonConfig';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';
import { getCurrentUserId } from '../services/referralService';
import { getUserData, updateTelegramWriteAccess, getTaskStatus } from '../services/userService';
import { AnimatePresence, motion } from 'motion/react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const { 
    favorites, 
    coins, 
    transactions, 
    watchedHours, 
    moviesCount, 
    seriesCount, 
    streakDays, 
    lastDailyReward,
    claimDailyReward, 
    claimAdReward, 
    premiumUntil, 
    setPremiumUntil,
    buyVipPass,
    isVipActive,
    getTotalCoinsEarned,
  } = useAppStore();
  
  const [tgUser, setTgUser] = useState<any>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showVipShopModal, setShowVipShopModal] = useState(false);
  const [showTonModal, setShowTonModal] = useState(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [writeAccessStatus, setWriteAccessStatus] = useState<'allowed' | 'denied' | 'unknown'>('unknown');
  const [isWriteAccessCompleted, setIsWriteAccessCompleted] = useState(false);
  const [isWriteAccessLoading, setIsWriteAccessLoading] = useState(false);
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // Toast feedback state instead of window.alert
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  const isPremium = isVipActive();
  const totalCoinsEarned = getTotalCoinsEarned();
  const remainingVipDays = premiumUntil && premiumUntil > Date.now() 
    ? Math.ceil((premiumUntil - Date.now()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const [dailyTimeLeft, setDailyTimeLeft] = useState<string>('');
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(true);

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

  const handleClaimDailyWithAd = async () => {
    if (!canClaimDaily) return;

    setIsClaimingDaily(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.DAILY_STREAK);
      if (success) {
        const res = claimDailyReward();
        if (res.success) {
          showToast(
            isArabic 
              ? `تهانينا! استلمت مكافأة اليوم ${res.streak}: +${res.reward} نقطة!` 
              : `Claimed Day ${res.streak} reward: +${res.reward} coins!`,
            'success'
          );
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

  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const data = await getUserData(uid);
        if (data) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (data.dailyAdsDate === todayStr) {
            setAdsWatchedCount(data.adsWatchedToday || 0);
          } else {
            setAdsWatchedCount(0);
          }
          if (data.telegramWriteAccessStatus) {
            setWriteAccessStatus(data.telegramWriteAccessStatus);
          }
        }
        const taskCompleted = await getTaskStatus(uid, 'telegram_write_access');
        setIsWriteAccessCompleted(taskCompleted);
      }
    };
    fetchUserData();
  }, [getCurrentUserId()]);

  const handleTelegramWriteAccess = () => {
    if (isWriteAccessLoading) return;
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
              setWriteAccessStatus(status);
              if (res.rewarded) {
                setIsWriteAccessCompleted(true);
                useAppStore.getState().addCoins(100, isArabic ? 'تفعيل إشعارات تيليجرام' : 'Enable Telegram Notifications');
                showToast(isArabic ? 'تم تفعيل الإشعارات وحصلت على +100 نقطة!' : 'Notifications enabled and you got +100 points!', 'success');
              } else {
                showToast(isArabic ? 'تم تفعيل الإشعارات بنجاح!' : 'Notifications enabled successfully!', 'success');
              }
            } else {
              showToast(isArabic ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings', 'info');
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
            setWriteAccessStatus('allowed');
            if (res.rewarded) {
              setIsWriteAccessCompleted(true);
              useAppStore.getState().addCoins(100, isArabic ? 'تفعيل إشعارات تيليجرام' : 'Enable Telegram Notifications');
              showToast(isArabic ? 'تم تفعيل الإشعارات وحصلت على +100 نقطة!' : 'Notifications enabled and you got +100 points!', 'success');
            }
          }
          setIsWriteAccessLoading(false);
        }, 1000);
      } else {
        setIsWriteAccessLoading(false);
      }
    }
  };

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe.user);
    }
  }, []);

  const displayName = tgUser 
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : 'Drama Fan';

  const displayUsername = tgUser?.username 
    ? `@${tgUser.username}` 
    : tgUser?.first_name 
    ? `@${tgUser.first_name.toLowerCase().replace(/\s+/g, '')}` 
    : '@dramafan';

  const user = {
    name: displayName,
    username: displayUsername,
    photoUrl: tgUser?.photo_url || null,
    watchedHours: watchedHours || 0,
    moviesCount: moviesCount || 0,
    seriesCount: seriesCount || 0,
    favoritesCount: favorites?.length || 0,
    streakDays: streakDays || 0,
    coins: coins || 0,
    subscription: isPremium ? 'premium' : 'free'
  };

  const streakRewards = [50, 70, 100, 120, 150, 200, 300];

  return (
    <div className="h-full w-full overflow-y-auto hide-scrollbar bg-[#070709] text-[#F4F4F6] flex flex-col relative pb-28" dir={isArabic ? 'rtl' : 'ltr'}>
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

      {/* Luxury Header Section */}
      <div className="flex-none bg-gradient-to-b from-[#16161F] via-[#101016] to-[#070709] px-4 sm:px-6 pt-4 pb-6 border-b border-white/[0.07] relative overflow-hidden">
        <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none ${isPremium ? 'bg-amber-500/15' : 'bg-red-600/10'}`} />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TopPointsBadge />

              <button 
                onClick={() => setShowTonModal(true)}
                className="flex items-center gap-1.5 px-3 h-8 sm:h-9 bg-gradient-to-r from-[#0098EA] to-blue-600 rounded-xl text-white font-extrabold text-xs shadow-lg shadow-[#0098EA]/25 border border-[#0098EA]/40 active:scale-95 transition-all"
              >
                <Wallet size={14} className="text-yellow-300" />
                <span>{isArabic ? 'دفع TON' : 'TON Pay'}</span>
              </button>

              <button 
                onClick={() => setShowTransactionsModal(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                title={isArabic ? "سجل العمليات" : "Transactions"}
              >
                <History size={15} />
              </button>
            </div>

            {tgUser?.username && ['sekanedr_is', 'ridha1993', 'Ridha1993'].some(u => u.toLowerCase() === tgUser.username.toLowerCase()) && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3.5 py-1.5 rounded-xl border border-red-500/30 active:scale-95 transition-all"
              >
                <Settings size={15} />
                <span className="text-xs font-extrabold">{isArabic ? 'لوحة التحكم' : 'Admin'}</span>
              </button>
            )}
          </div>
          
          {/* User Identity Card */}
          <div className="bg-[#121218]/90 border border-white/10 rounded-3xl p-4 sm:p-5 flex items-center gap-4 backdrop-blur-xl shadow-xl">
            {/* Avatar Ring */}
            <div className="relative flex-none">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[2.5px] ${
                isPremium 
                  ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                  : 'bg-gradient-to-tr from-red-600 via-orange-500 to-red-800 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}>
                <div className="w-full h-full rounded-[14px] bg-[#0B0B0F] flex items-center justify-center overflow-hidden">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <User size={30} className="text-white/40" />
                  )}
                </div>
              </div>
              {isPremium ? (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-0.5 border border-amber-300/40 whitespace-nowrap">
                  <Crown size={10} className="fill-black" />
                  <span>VIP</span>
                </div>
              ) : (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-zinc-700 whitespace-nowrap">
                  MEMBER
                </div>
              )}
            </div>

            {/* Name & Membership Status */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-start">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-white truncate tracking-tight">
                  {user.name}
                </h2>
                {isPremium && (
                  <Crown size={18} className="text-amber-400 fill-amber-400 flex-none" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                <span className="text-amber-300/90 font-semibold" dir="ltr">{user.username}</span>
                {tgUser?.id && (
                  <>
                    <span>·</span>
                    <span className="text-[11px] text-white/40 tabular-nums" dir="ltr">ID: {tgUser.id}</span>
                  </>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-xs font-bold ${isPremium ? 'text-emerald-400' : 'text-white/55'}`}>
                  {isPremium 
                    ? (isArabic ? `اشتراك VIP نشط (${remainingVipDays} يوم متبقي)` : `VIP Active (${remainingVipDays} days left)`) 
                    : (isArabic ? 'العضوية المجانية' : 'Free Membership')}
                </span>
                
                <button 
                  onClick={() => setShowTonModal(true)}
                  className="text-[11px] bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 text-amber-300 font-extrabold px-3 py-1 rounded-xl border border-amber-500/30 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Crown size={12} className="fill-amber-300" />
                  <span>{isPremium ? (isArabic ? 'تمديد VIP' : 'Extend VIP') : (isArabic ? 'ترقية لـ VIP' : 'Upgrade VIP')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-4 sm:px-6 pt-5 max-w-2xl mx-auto w-full flex flex-col gap-5">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-[#121217] border border-amber-500/25 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-500/5">
            <Gift size={17} className="text-amber-400" />
            <div className="text-base sm:text-lg font-black text-amber-300 leading-none tabular-nums" dir="ltr">{totalCoinsEarned.toLocaleString()}</div>
            <div className="text-[10px] text-amber-400/80 font-bold text-center">{isArabic ? 'مجموع الكسب' : 'Total Earned'}</div>
          </div>
          <div className="bg-[#121217] border border-white/[0.07] rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
            <Clock size={17} className="text-red-500" />
            <div className="text-base sm:text-lg font-black text-white leading-none tabular-nums" dir="ltr">{user.watchedHours}h</div>
            <div className="text-[10px] text-white/45 font-bold text-center">{t('watched', 'Watched')}</div>
          </div>
          <div className="bg-[#121217] border border-white/[0.07] rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
            <Flame size={17} className="text-orange-500" />
            <div className="text-base sm:text-lg font-black text-white leading-none tabular-nums" dir="ltr">{user.streakDays}</div>
            <div className="text-[10px] text-white/45 font-bold text-center">{t('streak', 'Streak')}</div>
          </div>
          <div className="bg-[#121217] border border-white/[0.07] rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
            <Film size={17} className="text-blue-400" />
            <div className="text-base sm:text-lg font-black text-white leading-none tabular-nums" dir="ltr">{user.moviesCount}</div>
            <div className="text-[10px] text-white/45 font-bold text-center">{t('movies', 'Movies')}</div>
          </div>
          <div className="bg-[#121217] border border-white/[0.07] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 col-span-2 sm:col-span-1">
            <Tv size={17} className="text-purple-400" />
            <div className="text-base sm:text-lg font-black text-white leading-none tabular-nums" dir="ltr">{user.seriesCount}</div>
            <div className="text-[10px] text-white/45 font-bold text-center">{t('series', 'Series')}</div>
          </div>
        </div>

        {/* Referral System Highlight Banner */}
        <div 
          onClick={() => setShowReferralModal(true)}
          className="bg-gradient-to-r from-[#241B0D] via-[#1C160C] to-[#121217] border border-amber-500/35 rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-lg active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-black font-black shadow-lg shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isArabic ? 'دعوة الأصدقاء وكسب النقاط' : 'Invite Friends & Earn Coins'}
              </h3>
              <p className="text-xs text-amber-200/75 mt-0.5">
                {isArabic ? 'احصل على +250 نقطة لكل إحالة ناجحة' : 'Get +250 coins for every friend invited'}
              </p>
            </div>
          </div>
          <button className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow-md whitespace-nowrap">
            {isArabic ? 'دعوة الآن' : 'Invite Now'}
          </button>
        </div>

        {/* VIP Store Button using Coins */}
        <div className="bg-gradient-to-r from-red-950/60 via-[#1A1218] to-[#121217] border border-red-500/30 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shrink-0">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isArabic ? 'متجر باقات VIP بالنقاط' : 'Coins VIP Shop'}
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {isArabic ? 'استبدل نقاطك باشتراك VIP ومشاهدة بلا حدود' : 'Exchange coins for unlimited VIP pass'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowVipShopModal(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all whitespace-nowrap"
          >
            {isArabic ? 'افتح المتجر' : 'Open Shop'}
          </button>
        </div>

        {/* 7-Day Daily Check-in Streak */}
        <div className="bg-[#121217] border border-white/[0.07] rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-orange-500" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                {isArabic ? `سلسلة الحضور اليومي (${streakDays} أيام)` : `Daily Streak (${streakDays} days)`}
              </h3>
            </div>
            <span className="text-[11px] text-amber-400 font-bold">
              {isArabic ? 'نقاط يومية متزايدة' : 'Daily bonus'}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {streakRewards.map((reward, index) => {
              const dayNum = index + 1;
              const isClaimed = streakDays >= dayNum;
              const isCurrent = streakDays + 1 === dayNum;

              return (
                <div 
                  key={index} 
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                    isClaimed 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                      : isCurrent
                      ? 'bg-white/10 border-amber-400 text-amber-300'
                      : 'bg-black/30 border-white/5 text-white/35'
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
            className={`w-full min-h-[44px] font-black text-xs py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              canClaimDaily 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black active:scale-98'
                : 'bg-white/[0.06] text-white/50 cursor-not-allowed border border-white/10'
            }`}
          >
            {isClaimingDaily ? (
              <span>{isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...'}</span>
            ) : !canClaimDaily ? (
              <span className="flex items-center gap-2">
                <Clock size={14} /> 
                <span>{isArabic ? 'متاح بعد:' : 'Available in:'}</span>
                <span className="font-mono tabular-nums text-amber-400" dir="ltr">{dailyTimeLeft}</span>
              </span>
            ) : (
              <span>{isArabic ? 'استلام المكافأة اليومية (إعلان)' : 'Claim Daily Reward (Watch Ad)'}</span>
            )}
          </button>
        </div>

        {/* TON Crypto Subscription Section */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="text-xs text-white/55 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="text-amber-400" size={15} />
              <span>{isArabic ? 'باقات VIP الرسمية عبر TON (بدون إعلانات)' : 'Official VIP Plans (Ad-Free)'}</span>
            </h3>
            <div className="scale-75 origin-right ton-connect-btn-wrapper">
              <TonConnectButton />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {TON_CONFIG.PACKAGES.map((pkg) => (
              <button 
                key={pkg.id}
                onClick={() => setShowTonModal(true)}
                className={`bg-[#121217] border ${
                  pkg.popular ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-white/10 hover:border-white/20'
                } p-3.5 rounded-2xl flex flex-col items-center justify-between gap-2 relative overflow-hidden active:scale-95 transition-all text-center min-h-[115px]`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[8px] font-black text-center py-0.5 uppercase tracking-wider w-full">
                    {isArabic ? pkg.badgeAr : pkg.badgeEn}
                  </div>
                )}
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${pkg.color} flex items-center justify-center text-white font-black shrink-0 ${pkg.popular ? 'mt-2' : ''}`}>
                  <Crown size={17} />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-white leading-tight block">
                    {isArabic ? pkg.titleAr : pkg.titleEn}
                  </span>
                  <span className="text-[11px] text-amber-300 font-black font-mono tabular-nums mt-1 inline-block" dir="ltr">
                    {pkg.tonPrice} TON
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <h3 className="text-xs text-white/55 font-extrabold uppercase tracking-wider text-start px-1">
            {t('settings', isArabic ? 'الإعدادات والتفضيلات' : 'Settings')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button 
              onClick={handleTelegramWriteAccess}
              disabled={writeAccessStatus === 'allowed' || isWriteAccessLoading}
              className="bg-[#121217] hover:bg-[#17171F] border border-white/[0.07] p-4 rounded-2xl flex items-center justify-between transition-all w-full disabled:opacity-90"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${
                  writeAccessStatus === 'allowed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-500'
                }`}>
                  <Bell size={18} />
                </div>
                <span className="font-bold text-xs sm:text-sm text-white">
                  {writeAccessStatus === 'allowed' 
                    ? (isArabic ? 'إشعارات تيليجرام مفعلة' : 'Telegram Notifications Active')
                    : (isArabic ? 'تفعيل إشعارات تيليجرام' : 'Enable Telegram Notifications')}
                </span>
              </div>
              {!isWriteAccessCompleted && writeAccessStatus !== 'allowed' && (
                <span className="text-xs text-amber-400 font-black tabular-nums" dir="ltr">+100</span>
              )}
            </button>
            
            <button 
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              className="bg-[#121217] hover:bg-[#17171F] border border-white/[0.07] p-4 rounded-2xl flex items-center justify-between transition-all w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-none text-indigo-400">
                  <Globe size={18} />
                </div>
                <span className="font-bold text-xs sm:text-sm text-white">{t('changeLanguage', isArabic ? 'تغيير اللغة' : 'Language')}</span>
              </div>
              <span className="text-xs text-indigo-300 uppercase font-black bg-indigo-500/15 px-2.5 py-1 rounded-lg" dir="ltr">
                {i18n.language === 'ar' ? 'العربية' : 'EN'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* VIP Shop Modal (Buy VIP with Coins) */}
      <PointsStoreModal 
        isOpen={showVipShopModal}
        onClose={() => setShowVipShopModal(false)}
        onOpenTonModal={() => setShowTonModal(true)}
      />

      {/* Transaction History Modal */}
      {showTransactionsModal && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#121217] border border-white/10 w-full max-w-md rounded-3xl p-5 relative flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <History size={18} className="text-amber-400" />
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {isArabic ? 'سجل معاملات النقاط' : 'Coin Transactions'}
                </h2>
              </div>
              <button 
                onClick={() => setShowTransactionsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 hide-scrollbar">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-white/[0.04] border border-white/5 p-3 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        tx.type === 'earn' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'earn' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{tx.reason}</div>
                        <div className="text-[10px] text-white/40 font-mono tabular-nums">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-black font-mono tabular-nums ${
                      tx.type === 'earn' ? 'text-emerald-400' : 'text-red-400'
                    }`} dir="ltr">
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-white/40 text-xs">
                  {isArabic ? 'لا توجد عمليات مسجلة بعد' : 'No transactions recorded yet'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ReferralHub 
        isOpen={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
      />

      <TonPaymentModal 
        isOpen={showTonModal}
        onClose={() => setShowTonModal(false)}
      />
    </div>
  );
};




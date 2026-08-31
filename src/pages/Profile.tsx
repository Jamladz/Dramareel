import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, Film, Tv, Flame, Gift, Settings, Crown, Share2, Wallet, User, Users, Sparkles, History, ShoppingBag, CheckCircle, ArrowUpRight, ArrowDownRight, Trophy, ChevronRight, Coins } from 'lucide-react';
import { useAppStore } from '../store';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { ReferralHub } from '../components/ReferralHub';
import { PointsStoreModal } from '../components/PointsStoreModal';
import { TopPointsBadge } from '../components/TopPointsBadge';
import { TonPaymentModal } from '../components/TonPaymentModal';
import { TON_CONFIG } from '../config/tonConfig';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';
import { getCurrentUserId, getShareTelegramLink } from '../services/referralService';

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
    hasJoinedTelegram,
    setJoinedTelegram
  } = useAppStore();
  
  const [tgUser, setTgUser] = useState<any>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showVipShopModal, setShowVipShopModal] = useState(false);
  const [showTonModal, setShowTonModal] = useState(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  
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
      // Trigger Adsgram Ad int-39489 for daily attendance streak
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.DAILY_STREAK);
      if (success) {
        const res = claimDailyReward();
        if (res.success) {
          const newTotalBalance = coins + res.reward;
          const newLifetimeEarned = totalCoinsEarned + res.reward;
          alert(
            isArabic 
              ? `🎉 تهانينا! تمت مشاهدة الإعلان واستلام مكافأة اليوم ${res.streak}: +${res.reward} نقطة!\n💰 مجموع نقاطك الحالي: ${newTotalBalance} نقطة\n🏆 إجمالي النقاط المكتسبة كلياً: ${newLifetimeEarned} نقطة` 
              : `🎉 Congratulations! Claimed Day ${res.streak} reward: +${res.reward} coins!\n💰 Current Balance: ${newTotalBalance} coins\n🏆 Total Earned: ${newLifetimeEarned} coins`
          );
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

  
  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const DAILY_AD_LIMIT = 20;

  useEffect(() => {
    const fetchUserData = async () => {
      if (getCurrentUserId()) {
        const data = await getUserData(getCurrentUserId());
        if (data) {
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
  }, [getCurrentUserId()]);

  const handleRewardAd = async () => {
    if (adsWatchedCount >= DAILY_AD_LIMIT) {
      alert(isArabic ? 'لقد وصلت إلى الحد اليومي، حاول غدًا.' : 'Daily limit reached, try tomorrow.');
      return;
    }
    
    setIsRewardAdLoading(true);
    try {
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.REWARD_AD);
      if (success) {
        // Wait 2-3 seconds for backend to process the callback
        await new Promise(r => setTimeout(r, 2500));
        
        // Fetch new balance from backend
        if (getCurrentUserId()) {
          const data = await getUserData(getCurrentUserId());
          if (data && data.coins > coins) {
             useAppStore.getState().setCoinsFromServer(data.coins);
             const todayStr = new Date().toISOString().split('T')[0];
             if (data.dailyAdsDate === todayStr) {
               setAdsWatchedCount(data.adsWatchedToday || 0);
             }
             alert(isArabic ? 'تمت إضافة 100 نقطة 🎉' : 'Added 100 points 🎉');
          } else {
             // Fallback if backend didn't update yet or failed
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
      // Trigger Adsgram Ad block int-39490 for Watch Ad reward
      const success = await showAdsgramAd(ADSGRAM_BLOCKS.WATCH_AD);
      if (success) {
        if (claimAdReward()) {
          const newBalance = coins + 30;
          const newEarned = totalCoinsEarned + 30;
          alert(
            isArabic 
              ? `🎉 شكراً لمشاهدتك الإعلان! تمت إضافة +30 نقطة لرصيدك!\n💰 مجموع رصيد نقاطك الحالي: ${newBalance} نقطة\n🏆 إجمالي النقاط المكتسبة كلياً: ${newEarned} نقطة` 
              : `🎉 Thanks for watching! +30 Coins added!\n💰 Current Balance: ${newBalance} coins\n🏆 Total Earned: ${newEarned} coins`
          );
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

  const handleBuyVipWithCoins = (days: number, cost: number) => {
    if (coins < cost) {
      alert(isArabic ? `رصيدك غير كافٍ. تحتاج إلى ${cost} نقطة.` : `Insufficient coins. You need ${cost} coins.`);
      return;
    }
    const success = buyVipPass(days, cost);
    if (success) {
      alert(
        isArabic 
          ? `🎉 تم تفعيل اشتراك VIP بنجاح لمدة ${days} أيام!\n💰 المتبقي في رصيدك: ${coins - cost} نقطة.` 
          : `🎉 VIP active for ${days} days!\n💰 Remaining balance: ${coins - cost} coins.`
      );
      setShowVipShopModal(false);
    }
  };

  const handleSubscribeTon = async (days: number, amount: number) => {
    if (!userAddress) {
      tonConnectUI.openModal();
      return;
    }
    
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: "0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE9X",
            amount: (amount * 1000000000).toString(),
          }
        ]
      };

      await tonConnectUI.sendTransaction(transaction);
      
      const newPremiumUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
      setPremiumUntil(newPremiumUntil);
      
      alert(t('subscriptionSuccess', 'Successfully subscribed for {{days}} days!', { days }));
    } catch (error) {
      console.error('Subscription error:', error);
      alert(t('transactionFailed', 'Transaction failed or canceled.'));
    }
  };

  const streakRewards = [50, 70, 100, 120, 150, 200, 300];

  return (
    <div className="h-full w-full min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col relative" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex-none bg-gradient-to-b from-[#1A1A20] via-[#121216] to-[#0A0A0D] px-5 py-6 border-b border-white/10 rounded-b-[2.5rem] shadow-2xl z-10 w-full relative overflow-hidden">
        {/* Ambient Glows */}
        <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${isPremium ? 'bg-amber-500/15' : 'bg-red-600/10'}`} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <TopPointsBadge />

            <button 
              onClick={() => setShowTonModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0098EA] to-blue-600 rounded-full text-white font-black text-xs shadow-lg shadow-[#0098EA]/30 border border-[#0098EA]/40 active:scale-95 transition-all"
            >
              <Wallet size={14} className="text-yellow-300" />
              <span>{isArabic ? 'دفع TON' : 'TON Pay'}</span>
            </button>

            <button 
              onClick={() => setShowTransactionsModal(true)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all shadow-md"
              title={isArabic ? "سجل العمليات" : "Transactions"}
            >
              <History size={15} />
            </button>
          </div>

          {tgUser?.username && ['sekanedr_is', 'ridha1993', 'Ridha1993'].some(u => u.toLowerCase() === tgUser.username.toLowerCase()) && (
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3.5 py-1.5 rounded-full border border-red-500/30 active:scale-95 transition-all shadow-md"
            >
              <Settings size={15} />
              <span className="text-xs font-bold">{isArabic ? 'لوحة التحكم' : 'Admin'}</span>
            </button>
          )}
        </div>
        
        {/* User Card */}
        <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md shadow-inner">
          {/* Avatar Ring */}
          <div className="relative flex-none">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] ${
              isPremium 
                ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.35)]' 
                : 'bg-gradient-to-tr from-red-600 via-orange-500 to-red-800 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
            }`}>
              <div className="w-full h-full rounded-full bg-[#0D0D10] flex items-center justify-center overflow-hidden">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={30} className="text-white/40" />
                )}
              </div>
            </div>
            {/* VIP / Member Badge */}
            {isPremium ? (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-0.5 border border-amber-300/40">
                <Crown size={10} className="fill-black" />
                <span>VIP</span>
              </div>
            ) : (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-zinc-700">
                MEMBER
              </div>
            )}
          </div>

          {/* Name & Username Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-start">
            {/* Full Name + Crown */}
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-white truncate tracking-tight">
                {user.name}
              </h2>
              {isPremium && (
                <Crown size={18} className="text-amber-400 fill-amber-400 flex-none animate-pulse" />
              )}
            </div>

            {/* Username & Telegram ID */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                <span className="text-xs font-mono font-medium text-amber-300/90" dir="ltr">
                  {user.username}
                </span>
              </div>

              {tgUser?.id && (
                <span className="text-[10px] text-white/40 font-mono px-2 py-0.5 bg-black/40 rounded-md border border-white/5" dir="ltr">
                  ID: {tgUser.id}
                </span>
              )}
            </div>

            {/* Membership status line */}
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPremium ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-white/30'}`} />
                <span className={`font-semibold ${isPremium ? 'text-emerald-400' : 'text-white/50'}`}>
                  {isPremium 
                    ? (isArabic ? `اشتراك VIP نشط (${remainingVipDays} يوم متبقي)` : `VIP Active (${remainingVipDays} days left)`) 
                    : (isArabic ? 'العضوية المجانية' : 'Free Membership')}
                </span>
              </div>
              
              <button 
                onClick={() => setShowTonModal(true)}
                className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold px-2.5 py-1 rounded-full border border-amber-500/30 active:scale-95 transition-all flex items-center gap-1"
              >
                <Crown size={11} className="fill-amber-300" />
                <span>{isPremium ? (isArabic ? 'تمديد الاشتراك' : 'Extend VIP') : (isArabic ? 'ترقية لـ VIP' : 'Upgrade VIP')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto p-4 flex flex-col gap-6 pb-24">
        
        {/* Referral System Highlight Banner */}
        <div 
          onClick={() => setShowReferralModal(true)}
          className="bg-gradient-to-r from-amber-950 via-yellow-900/80 to-[#181818] border border-amber-500/40 rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-xl shadow-amber-500/10 active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-black font-black shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-white">
                  {isArabic ? 'دعوة الأصدقاء وكسب النقاط' : 'Invite Friends & Earn Coins'}
                </h3>
                <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {isArabic ? 'احصل على +250 نقطة لكل إحالة ناجحة' : 'Get +250 coins for every friend invited'}
              </p>
            </div>
          </div>
          <button className="px-3 py-2 bg-yellow-500 text-black font-black text-xs rounded-xl shadow-md whitespace-nowrap">
            {isArabic ? 'دعوة الآن' : 'Invite Now'}
          </button>
        </div>

        {/* 7-Day Daily Check-in Streak */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-orange-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isArabic ? `سلسلة الحضور اليومي (${streakDays} أيام)` : `Daily Streak (${streakDays} days)`}
              </h3>
            </div>
            <span className="text-[11px] text-yellow-400 font-bold">
              {isArabic ? 'احصل على نقاط مضاعفة!' : 'Earn streak bonus!'}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {streakRewards.map((reward, index) => {
              const dayNum = index + 1;
              const isClaimed = streakDays >= dayNum;
              const isCurrent = streakDays + 1 === dayNum;

              return (
                <div 
                  key={index} 
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    isClaimed 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                      : isCurrent
                      ? 'bg-white/10 border-yellow-400 text-yellow-300 animate-pulse'
                      : 'bg-white/5 border-white/5 text-white/40'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase mb-1">
                    {isArabic ? `يوم ${dayNum}` : `D${dayNum}`}
                  </span>
                  <span className="text-xs font-black" dir="ltr">+{reward}</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleClaimDailyWithAd}
            disabled={isClaimingDaily || !canClaimDaily}
            className={`w-full font-black text-xs py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              canClaimDaily 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black active:scale-95'
                : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/5'
            }`}
          >
            {isClaimingDaily ? (
              <span>{isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...'}</span>
            ) : !canClaimDaily ? (
              <span className="flex items-center gap-2">
                <Clock size={14} /> 
                {isArabic ? 'متاح بعد:' : 'Available in:'} <span dir="ltr">{dailyTimeLeft}</span>
              </span>
            ) : (
              <span>{isArabic ? 'استلام المكافأة اليومية (إعلان)' : 'Claim Daily Reward (Watch Ad)'}</span>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#111111] border border-yellow-500/20 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-amber-500/5">
            <Gift size={18} className="text-yellow-400" />
            <div className="text-lg font-black text-yellow-300 leading-none" dir="ltr">{totalCoinsEarned}</div>
            <div className="text-[9px] text-yellow-400/80 uppercase font-bold text-center">{isArabic ? 'مجموع الكسب' : 'Total Earned'}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Clock size={18} className="text-red-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.watchedHours}h</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('watched', 'Watched')}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Flame size={18} className="text-orange-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.streakDays}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('streak', 'Streak')}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Film size={18} className="text-blue-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.moviesCount}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('movies', 'Movies')}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 col-span-2 sm:col-span-1">
            <Tv size={18} className="text-purple-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.seriesCount}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('series', 'Series')}</div>
          </div>
        </div>

        {/* VIP Store Button using Coins */}
        <div className="bg-gradient-to-r from-red-950/60 via-purple-900/40 to-[#151515] border border-red-500/30 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center text-black font-black shadow-lg">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isArabic ? 'متجر VIP بالنقاط' : 'Coins VIP Shop'}
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {isArabic ? 'استبدل نقاطك باشتراك VIP ومشاهدة بلا حدود' : 'Exchange coins for unlimited VIP pass'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowVipShopModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs rounded-xl shadow-md active:scale-95"
          >
            {isArabic ? 'افتح المتجر' : 'Open Shop'}
          </button>
        </div>

        {/* Earn Coins Actions */}
        <div className="w-full">
          <h3 className="text-xs text-white/50 font-bold mb-3 uppercase tracking-wider text-start px-1">{t('earnCoins', 'Earn Coins')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={() => setShowReferralModal(true)}
              className="bg-[#1A1A1A] border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-none">
                  <Users className="text-amber-400" size={16} />
                </div>
                <span className="font-bold text-sm text-white">{isArabic ? 'دعوة صديق جديد' : 'Invite Friend'}</span>
              </div>
              <span className="text-xs text-amber-400 font-black bg-amber-500/10 px-2 py-1 rounded-md" dir="ltr">+250</span>
            </button>

            
            {/* AdsGram Reward Ad Task */}
            <button 
              onClick={handleRewardAd}
              disabled={isRewardAdLoading || adsWatchedCount >= DAILY_AD_LIMIT}
              className="bg-[#1A1A1A] border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-none">
                  <Tv className="text-blue-500" size={16} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-white">
                    {isRewardAdLoading 
                      ? (isArabic ? 'جاري التحميل...' : 'Loading...') 
                      : (isArabic ? '🎬 شاهد إعلان واحصل على مكافأة' : '🎬 Watch Ad for Reward')}
                  </span>
                  <span className="text-[10px] text-white/50 font-mono mt-0.5">
                    {adsWatchedCount}/{DAILY_AD_LIMIT} {isArabic ? 'يومياً' : 'Daily'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <span className="text-xs text-blue-500 font-black bg-blue-500/10 px-2 py-1 rounded-md" dir="ltr">+100</span>
              </div>
            </button>

            <button 
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              className="bg-[#1A1A1A] border border-green-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-none">
                  <Film className="text-green-500" size={16} />
                </div>
                <span className="font-bold text-sm text-white">
                  {isWatchingAd 
                    ? (isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...') 
                    : t('watchAd', 'Watch Ad')}
                </span>
              </div>
              <span className="text-xs text-green-500 font-black bg-green-500/10 px-2 py-1 rounded-md" dir="ltr">+30</span>
            </button>

            <button 
              onClick={() => {
                if (hasJoinedTelegram) return;
                window.open('https://t.me/dramareel2026', '_blank');
                setTimeout(() => {
                  useAppStore.getState().setJoinedTelegram();
                  useAppStore.getState().addCoins(100, 'انضمام لقناة التلجرام');
                }, 2000);
              }}
              disabled={hasJoinedTelegram}
              className="bg-[#1A1A1A] border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </div>
                <span className="font-bold text-sm text-white">
                  {hasJoinedTelegram 
                    ? (isArabic ? 'مكتملة' : 'Completed') 
                    : (isArabic ? 'انضم إلى قناتنا على تلجرام' : 'Join Telegram Channel')}
                </span>
              </div>
              <span className="text-xs text-cyan-400 font-black bg-cyan-500/10 px-2 py-1 rounded-md" dir="ltr">+100</span>
            </button>
          </div>
        </div>

        
            {/* AdsGram Reward Ad Task */}
            <button 
              onClick={handleRewardAd}
              disabled={isRewardAdLoading || adsWatchedCount >= DAILY_AD_LIMIT}
              className="bg-[#1A1A1A] border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-none">
                  <Tv className="text-blue-500" size={16} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-white">
                    {isRewardAdLoading 
                      ? (isArabic ? 'جاري التحميل...' : 'Loading...') 
                      : (isArabic ? '🎬 شاهد إعلان واحصل على مكافأة' : '🎬 Watch Ad for Reward')}
                  </span>
                  <span className="text-[10px] text-white/50 font-mono mt-0.5">
                    {adsWatchedCount}/{DAILY_AD_LIMIT} {isArabic ? 'يومياً' : 'Daily'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <span className="text-xs text-blue-500 font-black bg-blue-500/10 px-2 py-1 rounded-md" dir="ltr">+100</span>
              </div>
            </button>

        {/* TON Crypto Subscription Section */}
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
            <h3 className="text-xs text-white/50 font-bold uppercase tracking-wider flex items-center gap-2">
              <Crown className="text-yellow-500" size={14} />
              {isArabic ? 'باقات VIP الرسمية (بدون إعلانات)' : 'Official VIP Plans (Ad-Free)'}
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
                className={`bg-[#111111] border ${pkg.popular ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-white/10 hover:border-white/20'} p-3 rounded-2xl flex flex-col items-center justify-between gap-2 relative overflow-hidden active:scale-95 transition-all text-center min-h-[110px]`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[7px] font-black text-center py-0.5 uppercase tracking-wider w-full">
                    {isArabic ? pkg.badgeAr : pkg.badgeEn}
                  </div>
                )}
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${pkg.color} flex items-center justify-center text-white font-black shrink-0 ${pkg.popular ? 'mt-1.5' : ''}`}>
                  <Crown size={16} />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] text-white leading-tight block">
                    {isArabic ? pkg.titleAr : pkg.titleEn}
                  </span>
                  <span className="text-[10px] text-amber-300 font-black bg-amber-500/15 px-2 py-0.5 rounded-md mt-1 inline-block" dir="ltr">
                    {pkg.tonPrice} TON
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="w-full">
           <h3 className="text-xs text-white/50 font-bold mb-3 uppercase tracking-wider text-start px-1">{t('settings', 'Settings')}</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
                className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-none">
                    <Settings className="text-indigo-400" size={16} />
                  </div>
                  <span className="font-bold text-sm text-white">{t('changeLanguage', 'Language')}</span>
                </div>
                <span className="text-xs text-indigo-300 uppercase font-black bg-indigo-500/20 px-2 py-1 rounded-md" dir="ltr">{i18n.language.toUpperCase()}</span>
              </button>
              
              <button 
                onClick={() => setShowReferralModal(true)}
                className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-none">
                    <Share2 className="text-blue-500" size={16} />
                  </div>
                  <span className="font-bold text-sm text-white">{t('inviteFriends', 'Invite')}</span>
                </div>
                <span className="text-xs text-yellow-500 font-black bg-yellow-500/10 px-2 py-1 rounded-md" dir="ltr">+250</span>
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
          <div className="bg-[#141414] border border-white/10 w-full max-w-md rounded-3xl p-6 relative flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History size={20} className="text-yellow-400" />
                <h2 className="text-base font-extrabold text-white">
                  {isArabic ? 'سجل النقاط' : 'Coin Transactions'}
                </h2>
              </div>
              <button 
                onClick={() => setShowTransactionsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        tx.type === 'earn' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'earn' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{tx.reason}</div>
                        <div className="text-[10px] text-white/40">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-black ${
                      tx.type === 'earn' ? 'text-green-400' : 'text-red-400'
                    }`} dir="ltr">
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40 text-xs">
                  {isArabic ? 'لا توجد عمليات بعد' : 'No transactions recorded yet'}
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



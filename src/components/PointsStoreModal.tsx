import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Crown, Sparkles, Coins, CheckCircle2, Zap, Gift, ArrowRight, Users, Tv, CalendarCheck, Smartphone, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { ReferralHub } from './ReferralHub';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';
import { getCurrentUserId } from '../services/referralService';
import { getTaskStatus, completeTelegramTask } from '../services/userService';

interface PointsStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTonModal?: () => void;
}

export const POINTS_VIP_PACKAGES = [
  {
    id: 'points-1day',
    days: 1,
    cost: 1200,
    titleAr: 'اشتراك يوم واحد VIP',
    titleEn: '1-Day VIP Pass',
    badgeAr: 'يوم مجاني بنقاطك',
    badgeEn: '1 Day Pass',
    popular: false,
  },
  {
    id: 'points-3days',
    days: 3,
    cost: 3000,
    titleAr: 'اشتراك 3 أيام VIP',
    titleEn: '3-Days VIP Pass',
    badgeAr: 'توفير جيد',
    badgeEn: 'Popular',
    popular: false,
  },
  {
    id: 'points-7days',
    days: 7,
    cost: 5000,
    titleAr: 'اشتراك 7 أيام VIP',
    titleEn: '7-Days VIP Pass',
    badgeAr: 'الأكثر طلباً ⭐',
    badgeEn: 'Best Seller ⭐',
    popular: true,
  },
  {
    id: 'points-month',
    days: 30,
    cost: 16000,
    titleAr: 'اشتراك شهر كامل (30 يوم)',
    titleEn: '1-Month VIP Pass (30 Days)',
    badgeAr: 'توفير ضخم 🔥',
    badgeEn: 'Huge Savings 🔥',
    popular: false,
  }
];

export const PointsStoreModal: React.FC<PointsStoreModalProps> = ({ isOpen, onClose, onOpenTonModal }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const { 
    coins, buyPointsVipPass, isVipActive, isPaidVip, 
    premiumUntil, claimDailyReward, claimAdReward, getTotalCoinsEarned 
  } = useAppStore();

  const [selectedPkgId, setSelectedPkgId] = useState<string>('points-7days');
  const [msg, setMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [showReferralHub, setShowReferralHub] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  
  const [homeScreenStatus, setHomeScreenStatus] = useState<'loading' | 'available' | 'completed' | 'unsupported'>('loading');
  const [addingToHome, setAddingToHome] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    
    const checkHomeTask = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg || !tg.addToHomeScreen || !tg.checkHomeScreenStatus) {
        setHomeScreenStatus('unsupported');
        return;
      }
      
      const userId = getCurrentUserId();
      const isCompleted = await getTaskStatus(userId, 'add_to_home_screen');
      if (isCompleted) {
        setHomeScreenStatus('completed');
      } else {
        setHomeScreenStatus('available');
      }
    };

    checkHomeTask();
  }, [isOpen]);

  const handleAddToHomeScreen = async () => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.addToHomeScreen || !tg.checkHomeScreenStatus) {
      setMsg({ text: isArabic ? 'هذه الميزة غير مدعومة في إصدار تيليجرام الخاص بك' : 'Unsupported Telegram version', success: false });
      return;
    }

    setAddingToHome(true);
    
    try {
      tg.addToHomeScreen();
      
      // Wait for a little bit before checking status to give time for the prompt
      setTimeout(() => {
        tg.checkHomeScreenStatus(async (status: string) => {
          if (status === 'added') {
            const userId = getCurrentUserId();
            const res = await completeTelegramTask(userId, 'add_to_home_screen', 200);
            if (res.success) {
              // Update local state
              useAppStore.getState().addCoins(200, 'إضافة التطبيق للشاشة الرئيسية');
              setHomeScreenStatus('completed');
              setMsg({ text: isArabic ? '🎉 تم إكمال المهمة! حصلت على +200 نقطة' : '🎉 Task completed! Earned +200 pts', success: true });
            } else {
              setMsg({ text: isArabic ? 'حدث خطأ أثناء حفظ المهمة' : 'Error saving task', success: false });
            }
          } else if (status === 'unknown') {
             setMsg({ text: isArabic ? 'لم نتمكن من التحقق من الحالة' : 'Status check unknown', success: false });
          } else {
             setMsg({ text: isArabic ? 'لم يتم إضافة الاختصار بعد' : 'Shortcut not added yet', success: false });
          }
          setAddingToHome(false);
        });
      }, 5000); // 5 seconds wait for user to accept prompt

    } catch (error) {
      setMsg({ text: 'Error interacting with Telegram API', success: false });
      setAddingToHome(false);
    }
  };

  if (!isOpen) return null;

  const selectedPkg = POINTS_VIP_PACKAGES.find(p => p.id === selectedPkgId) || POINTS_VIP_PACKAGES[0];
  const totalEarned = getTotalCoinsEarned();

  const handleRedeem = () => {
    setMsg(null);
    if (coins < selectedPkg.cost) {
      setMsg({
        text: isArabic 
          ? `رصيد نقاطك الحالي (${coins.toLocaleString()}) غير كافٍ. تحتاج إلى ${selectedPkg.cost.toLocaleString()} نقطة. يمكنك كسب المزيد أدناه!`
          : `Insufficient balance (${coins.toLocaleString()} coins). You need ${selectedPkg.cost.toLocaleString()} coins. Earn more below!`,
        success: false
      });
      return;
    }

    const success = buyPointsVipPass(selectedPkg.days, selectedPkg.cost);
    if (success) {
      setMsg({
        text: isArabic 
          ? `🎉 تم تفعيل اشتراك VIP بالنقاط لمدة ${selectedPkg.days} يوم بنجاح! ستشاهد الآن إعلان 1 فقط كل 6 فيديوهات.`
          : `🎉 Successfully activated ${selectedPkg.days}-day VIP Pass! You will now see only 1 ad every 6 videos.`,
        success: true
      });
    } else {
      setMsg({
        text: isArabic ? 'حدث خطأ أثناء استبدال النقاط' : 'Failed to redeem points',
        success: false
      });
    }
  };

  const handleClaimDaily = () => {
    setMsg(null);
    const res = claimDailyReward();
    if (res.success) {
      setMsg({
        text: isArabic 
          ? `🎉 حصلت على +${res.reward} نقطة! (سلسلة تسجيل الدخول: اليوم ${res.streak})`
          : `🎉 You earned +${res.reward} coins! (Streak Day ${res.streak})`,
        success: true
      });
    } else {
      setMsg({
        text: isArabic 
          ? 'لقد استلمت مكافأة تسجيل الدخول اليومية بالفعل. عد غداً لمكافأة أكبر!'
          : 'Already claimed today\'s reward. Come back tomorrow!',
        success: false
      });
    }
  };

  const handleWatchAdReward = async () => {
    setMsg(null);
    setIsAdLoading(true);
    const success = await showAdsgramAd(ADSGRAM_BLOCKS.WATCH_AD);
    setIsAdLoading(false);

    if (success) {
      claimAdReward();
      setMsg({
        text: isArabic ? '🎉 تم إضافة +30 نقطة إلى رصيدك الشامل لمشاهدة الإعلان!' : '🎉 Added +30 coins for watching ad!',
        success: true
      });
    } else {
      const adSuccess = claimAdReward();
      if (adSuccess) {
        setMsg({
          text: isArabic ? '🎉 تم إضافة +30 نقطة إلى رصيدك الشامل!' : '🎉 Added +30 coins to your balance!',
          success: true
        });
      } else {
        setMsg({
          text: isArabic ? 'يرجى الانتظار بضع دقائق قبل مشاهدة إعلان جديد' : 'Please wait a few minutes before watching another ad',
          success: false
        });
      }
    }
  };

  const formattedExpiry = premiumUntil ? new Date(premiumUntil).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US') : null;

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div 
        className="bg-[#12110F] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.25)] animate-in slide-in-from-bottom duration-300 my-0 sm:my-auto"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-yellow-900/80 to-[#12110F] p-5 border-b border-amber-500/20 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 text-black font-black">
              <Crown size={26} className="fill-black" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                {isArabic ? 'متجر باقات VIP بالنقاط' : 'Points VIP Store'}
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xs text-amber-200/80">
                {isArabic ? 'استبدل أرباحك ونقاطك باشتراكات VIP' : 'Redeem your points balance for VIP Passes'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">

          {/* Current Points Balance Box */}
          <div className="bg-gradient-to-r from-amber-950/60 via-yellow-950/30 to-[#1A1815] border border-amber-500/40 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
                  <Coins size={26} className="fill-black" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wider">
                    {isArabic ? 'مجموع النقاط المتاحة' : 'Total Combined Balance'}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-yellow-400 font-mono" dir="ltr">{coins.toLocaleString()}</span>
                    <span className="text-xs font-black text-amber-200">{isArabic ? 'نقطة' : 'coins'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="inline-block text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {isArabic ? 'جاهز للاستخدام' : 'Active & Ready'}
                </span>
                <span className="text-[10px] text-amber-200/60 mt-1 font-medium">
                  {isArabic ? `إجمالي كسبك: ${totalEarned.toLocaleString()}` : `Total Earned: ${totalEarned.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Earn Options Section */}
          <div>
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2.5 flex items-center justify-between">
              <span>{isArabic ? '⚡ كسب المزيد من النقاط المجانية:' : '⚡ Earn More Free Points:'}</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {/* 1. Invite Friends */}
              <button 
                onClick={() => setShowReferralHub(true)}
                className="bg-gradient-to-b from-amber-950/40 to-[#1A1815] border border-amber-500/30 hover:border-amber-400 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  <Users size={18} />
                </div>
                <span className="text-[11px] font-black text-white leading-tight">
                  {isArabic ? 'دعوة صديق' : 'Invite Friend'}
                </span>
                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                  +250 {isArabic ? 'نقطة' : 'pts'}
                </span>
              </button>

              {/* 2. Watch Ad */}
              <button 
                onClick={handleWatchAdReward}
                disabled={isAdLoading}
                className="bg-gradient-to-b from-red-950/40 to-[#1A1815] border border-red-500/30 hover:border-red-400 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <Tv size={18} />
                </div>
                <span className="text-[11px] font-black text-white leading-tight">
                  {isAdLoading ? (isArabic ? 'تحميل...' : 'Loading...') : (isArabic ? 'مشاهدة إعلان' : 'Watch Ad')}
                </span>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                  +30 {isArabic ? 'نقطة' : 'pts'}
                </span>
              </button>

              {/* 3. Daily Check-in */}
              <button 
                onClick={handleClaimDaily}
                className="bg-gradient-to-b from-emerald-950/40 to-[#1A1815] border border-emerald-500/30 hover:border-emerald-400 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <CalendarCheck size={18} />
                </div>
                <span className="text-[11px] font-black text-white leading-tight">
                  {isArabic ? 'مكافأة يومية' : 'Daily Reward'}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  +50-300 {isArabic ? 'نقطة' : 'pts'}
                </span>
              </button>
            </div>

            {/* Telegram Home Screen Task */}
            {homeScreenStatus !== 'unsupported' && (
              <div className="mt-3 bg-gradient-to-r from-blue-950/40 to-[#1A1815] border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-white">
                      {isArabic ? 'أضف التطبيق للشاشة الرئيسية' : 'Add to Home Screen'}
                    </h4>
                    <p className="text-[10px] text-blue-200/70 font-medium leading-tight max-w-[180px]">
                      {isArabic 
                        ? 'أضف اختصار التطبيق إلى شاشة هاتفك للوصول السريع' 
                        : 'Add shortcut to your phone for quick access'}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex flex-col items-end gap-2 shrink-0">
                  <div className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                    +200 {isArabic ? 'نقطة' : 'pts'}
                  </div>
                  {homeScreenStatus === 'completed' ? (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 size={12} /> {isArabic ? 'مكتملة' : 'Completed'}
                    </span>
                  ) : (
                    <button 
                      onClick={handleAddToHomeScreen}
                      disabled={addingToHome || homeScreenStatus === 'loading'}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1"
                    >
                      {addingToHome ? (isArabic ? 'جارِ التحقق...' : 'Checking...') : (
                        <>
                          <Plus size={12} />
                          {isArabic ? 'إضافة الاختصار' : 'Add Shortcut'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current VIP Status Notification if active */}
          {isVipActive() && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
              isPaidVip()
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <Crown size={20} className="shrink-0" />
              <div>
                <span>
                  {isPaidVip()
                    ? (isArabic ? 'اشتراكك الحالي: VIP مدفوع (بدون إعلانات تماماً 🚀)' : 'Active: Paid VIP (100% Ad-Free 🚀)')
                    : (isArabic ? 'اشتراكك الحالي: VIP بالنقاط (إعلان كل 6 فيديوهات 🎬)' : 'Active: Points VIP (1 ad per 6 videos 🎬)')
                  }
                </span>
                {formattedExpiry && (
                  <p className="text-[10px] opacity-80 mt-0.5" dir={isArabic ? 'rtl' : 'ltr'}>
                    {isArabic ? `تنتهي الصلاحية في: ${formattedExpiry}` : `Expires on: ${formattedExpiry}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Difference Notice: Points VIP vs Paid VIP */}
          <div className="bg-[#181613] border border-amber-500/20 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <Zap size={15} />
              <span>{isArabic ? 'مميزات VIP بالنقاط مقابل VIP المدفوع:' : 'Points VIP vs Paid VIP:'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/10">
                <span className="font-black text-amber-300 block mb-0.5">
                  {isArabic ? '⭐ VIP بالنقاط' : '⭐ Points VIP'}
                </span>
                <span className="text-white/70">
                  {isArabic ? 'تستمتع بمشاهدة إعلان 1 فقط كل 6 فيديوهات بدلاً من فيديوهين' : '1 ad every 6 videos instead of every 2'}
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-blue-500/20">
                <span className="font-black text-blue-400 block mb-0.5">
                  {isArabic ? '🚀 VIP مدفوع (TON)' : '🚀 Paid VIP (TON)'}
                </span>
                <span className="text-white/70">
                  {isArabic ? 'مشاهدة غير محدودة وبدون إعلانات تماماً (0 إعلانات)' : 'Unlimited watching with zero ads (100% Ad-Free)'}
                </span>
              </div>
            </div>
          </div>

          {/* Packages List */}
          <div>
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3 flex items-center justify-between">
              <span>{isArabic ? 'اختر باقة VIP بالنقاط:' : 'Select Points VIP Package:'}</span>
            </h3>

            <div className="space-y-3">
              {POINTS_VIP_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const canAfford = coins >= pkg.cost;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex items-center justify-between ${
                      isSelected 
                        ? 'bg-gradient-to-r from-amber-950/70 via-yellow-950/40 to-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                        : 'bg-[#181818] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black text-[9px] font-black px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
                        {isArabic ? pkg.badgeAr : pkg.badgeEn}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-400' : 'border-white/30'
                      }`}>
                        {isSelected && <CheckCircle2 size={12} className="text-black font-bold" />}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white">
                          {isArabic ? pkg.titleAr : pkg.titleEn}
                        </h4>
                        <p className="text-[11px] text-amber-200/80 font-medium">
                          {isArabic 
                            ? `إعلان 1 فقط كل 6 فيديوهات لمدة ${pkg.days} ${pkg.days === 1 ? 'يوم' : 'أيام'}` 
                            : `1 ad every 6 videos for ${pkg.days} days`}
                        </p>
                      </div>
                    </div>

                    <div className="text-left" dir="ltr">
                      <span className={`text-sm font-black font-mono ${canAfford ? 'text-yellow-400' : 'text-white/40'}`}>
                        {pkg.cost.toLocaleString()} {isArabic ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold text-center ${
              msg.success 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}>
              {msg.text}
            </div>
          )}

          {/* Paid VIP Shortcut Link */}
          {onOpenTonModal && (
            <div 
              onClick={() => {
                onClose();
                onOpenTonModal();
              }}
              className="p-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {isArabic ? 'هل تريد مشاهدة بدون إعلانات تماماً؟' : 'Want 100% Zero Ads?'}
                  </h4>
                  <p className="text-[10px] text-blue-200/80">
                    {isArabic ? 'انقر للاشتراك المدفوع عبر TON (بدون إعلانات)' : 'Click for Paid Subscriptions via TON'}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className={`text-blue-400 ${isArabic ? 'rotate-180' : ''}`} />
            </div>
          )}

        </div>

        {/* Footer Action */}
        <div className="p-5 border-t border-white/10 bg-[#0D0D0D]">
          <button
            onClick={handleRedeem}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black py-3.5 px-6 rounded-2xl shadow-[0_4px_25px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Gift size={18} />
            <span>
              {isArabic 
                ? `استبدال ${selectedPkg.cost.toLocaleString()} نقطة مقابل VIP (${selectedPkg.days} يوم)` 
                : `Redeem ${selectedPkg.cost.toLocaleString()} pts for ${selectedPkg.days}-Day VIP`}
            </span>
          </button>
        </div>

      </div>

      {/* Referral Hub Submodal */}
      <ReferralHub 
        isOpen={showReferralHub}
        onClose={() => setShowReferralHub(false)}
      />
    </div>,
    document.body
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Sparkles, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ChevronLeft,
  Users,
  Info,
  Gift,
  HelpCircle,
  Zap
} from 'lucide-react';
import { 
  getCurrentUserId, 
  getReferralLink, 
  getShareTelegramLink, 
  getWeeklyLeaderboard,
  getUserReferrals 
} from '../services/referralService';
import { ContestLeader } from '../types';
import { ReferralHub } from '../components/ReferralHub';

export const WeeklyContest: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [leaders, setLeaders] = useState<ContestLeader[]>([]);
  const [userReferralsCount, setUserReferralsCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Calculate time left until Sunday 23:59:59
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfWeek = new Date(now);
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const daysUntilSunday = (7 - dayOfWeek) % 7;
      
      endOfWeek.setDate(now.getDate() + (daysUntilSunday === 0 && now.getHours() >= 23 && now.getMinutes() >= 59 ? 7 : daysUntilSunday));
      endOfWeek.setHours(23, 59, 59, 999);

      const diff = endOfWeek.getTime() - now.getTime();
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const uid = getCurrentUserId();
    setCurrentUserId(uid);

    async function loadContestData() {
      setLoading(true);
      try {
        const board = await getWeeklyLeaderboard(uid);
        setLeaders(board);

        const myRecord = board.find(b => b.isCurrentUser || b.id === uid);
        if (myRecord) {
          setUserReferralsCount(myRecord.referralsCount);
        } else {
          const myRefs = await getUserReferrals(uid);
          setUserReferralsCount(myRefs.length);
        }
      } catch (err) {
        console.error('Error loading weekly contest data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadContestData();
  }, []);

  const refLink = getReferralLink(currentUserId);

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareTelegram = () => {
    const shareUrl = getShareTelegramLink(currentUserId, isArabic);
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  // Find user rank
  const myRank = leaders.findIndex(l => l.isCurrentUser || l.id === currentUserId) + 1;

  const getPrizeForRank = (rank: number) => {
    if (rank === 1) return isArabic ? 'باقة شهر مجاني (30 يوم VIP)' : '1 Month Free VIP (30 Days)';
    if (rank === 2) return isArabic ? 'باقة أسبوع مجاني (7 أيام VIP)' : '1 Week Free VIP (7 Days)';
    if (rank === 3) return isArabic ? 'باقة 3 أيام مجانية (3 أيام VIP)' : '3 Days Free VIP (3 Days)';
    if (rank >= 4 && rank <= 10) return isArabic ? 'باقة يوم واحد (1 يوم VIP)' : '1 Day Free VIP (1 Day)';
    return isArabic ? 'ادعُ أصلقائك للدخول في قائمة الفائزين!' : 'Invite friends to enter winner list!';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] pb-28 flex flex-col relative" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Bar Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0E]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 active:scale-90 transition-all"
        >
          {isArabic ? <ChevronLeft size={22} className="rotate-180" /> : <ChevronLeft size={22} />}
        </button>

        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
          <h1 className="text-base font-black text-white">
            {isArabic ? 'المسابقة الأسبوعية للإحالات' : 'Weekly Referral Contest'}
          </h1>
        </div>

        <button 
          onClick={() => setShowRulesModal(true)}
          className="w-9 h-9 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 active:scale-90 transition-all"
          title={isArabic ? 'شروط المسابقة' : 'Rules'}
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Hero Banner with Golden Glow */}
      <div className="relative overflow-hidden bg-gradient-to-b from-amber-950/80 via-yellow-950/40 to-[#050505] p-5 border-b border-amber-500/20">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-md mx-auto">
          {/* Main Trophy Icon */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <div className="w-full h-full bg-[#12100B] rounded-[22px] flex items-center justify-center text-yellow-400">
              <Trophy size={36} className="fill-yellow-400" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[11px] mb-1">
              <Sparkles size={13} className="fill-amber-300" />
              {isArabic ? 'سباق التحدي الأسبوعي' : 'Weekly Race Challenge'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isArabic ? 'تنافس واكسب اشتراكات VIP مجانية!' : 'Compete & Win Free VIP Passes!'}
            </h2>
            <p className="text-xs text-amber-200/70 mt-1 max-w-xs mx-auto">
              {isArabic 
                ? 'أكثر 10 أعضاء دعوة للأصدقاء هذا الأسبوع يحصلون على باقات VIP مجانية تلقائياً!' 
                : 'Top 10 referrers this week win free VIP passes automatically!'}
            </p>
          </div>

          {/* Weekly Countdown Timer */}
          <div className="w-full bg-[#121216]/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Clock size={14} />
              <span>{isArabic ? 'الوقت المتبقي لانتهاء مسابقة الأسبوع:' : 'Time Left This Week:'}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center w-full max-w-xs" dir="ltr">
              <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                <span className="text-base font-black text-white block">{timeLeft.days}</span>
                <span className="text-[9px] text-white/50 font-bold uppercase">{isArabic ? 'يوم' : 'Days'}</span>
              </div>
              <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                <span className="text-base font-black text-white block">{timeLeft.hours}</span>
                <span className="text-[9px] text-white/50 font-bold uppercase">{isArabic ? 'ساعة' : 'Hours'}</span>
              </div>
              <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                <span className="text-base font-black text-white block">{timeLeft.minutes}</span>
                <span className="text-[9px] text-white/50 font-bold uppercase">{isArabic ? 'دقيقة' : 'Mins'}</span>
              </div>
              <div className="bg-black/60 p-2 rounded-xl border border-yellow-500/40 text-yellow-400">
                <span className="text-base font-black block">{timeLeft.seconds}</span>
                <span className="text-[9px] text-yellow-400/70 font-bold uppercase">{isArabic ? 'ثانية' : 'Secs'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 space-y-6 max-w-lg mx-auto w-full">

        {/* User's Current Standing Card */}
        <div className="bg-gradient-to-r from-[#18181C] via-[#121215] to-[#18181C] border border-amber-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black flex items-center justify-center text-sm shadow-md">
                #{myRank > 0 ? myRank : '-'}
              </div>
              <div>
                <span className="text-xs font-bold text-white/60 block">
                  {isArabic ? 'مركزك الحالي في الترتيب' : 'Your Current Standing'}
                </span>
                <span className="text-sm font-black text-amber-400">
                  {myRank > 0 ? (isArabic ? `المركز #${myRank}` : `Rank #${myRank}`) : (isArabic ? 'خارج الترتيب' : 'Not Ranked')}
                </span>
              </div>
            </div>

            <div className="text-end">
              <span className="text-xs font-bold text-white/60 block">{isArabic ? 'عدد إحالاتك' : 'Your Referrals'}</span>
              <span className="text-lg font-black text-white" dir="ltr">{userReferralsCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs bg-black/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/60 font-medium">{isArabic ? 'الجائزة المتوقعة:' : 'Expected Prize:'}</span>
            <span className="font-extrabold text-yellow-300">
              {getPrizeForRank(myRank > 0 ? myRank : 99)}
            </span>
          </div>
        </div>

        {/* Prizes Breakdown Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Gift size={16} className="text-amber-400" />
              {isArabic ? 'جوائز مسابقة هذا الأسبوع' : 'Weekly Contest Prizes'}
            </h3>
            <span className="text-[10px] text-amber-400/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {isArabic ? 'تسلّم تلقائياً' : 'Auto Distributed'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* 1st Place */}
            <div className="bg-gradient-to-r from-amber-950/70 via-yellow-900/40 to-[#141414] border border-amber-500/60 p-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                {isArabic ? 'المركز الأول 🥇' : '1ST PLACE 🥇'}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-black font-black flex items-center justify-center text-lg shadow-md shrink-0">
                  👑
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {isArabic ? 'باقة شهر مجاني (30 يوماً VIP)' : '1 Month Free VIP (30 Days)'}
                  </h4>
                  <p className="text-[11px] text-amber-300/80 font-medium">
                    {isArabic ? 'مشاهدة غير محدودة وبدون إعلانات طوال الشهر' : 'Unlimited ad-free streaming for a full month'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2nd Place */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1A1A22] to-[#141414] border border-slate-400/40 p-3.5 rounded-2xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-slate-300 text-black text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                {isArabic ? 'المركز الثاني 🥈' : '2ND PLACE 🥈'}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 text-black font-black flex items-center justify-center text-base shadow-md shrink-0">
                  🥈
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {isArabic ? 'باقة أسبوع مجاني (7 أيام VIP)' : '1 Week Free VIP (7 Days)'}
                  </h4>
                  <p className="text-[11px] text-slate-300/80 font-medium">
                    {isArabic ? 'مشاهدة غير محدودة طوال الأسبوع' : 'Unlimited ad-free streaming for 7 days'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="bg-gradient-to-r from-amber-950/30 via-[#1A1815] to-[#141414] border border-amber-800/40 p-3.5 rounded-2xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-700 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                {isArabic ? 'المركز الثالث 🥉' : '3RD PLACE 🥉'}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black flex items-center justify-center text-base shadow-md shrink-0">
                  🥉
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {isArabic ? 'باقة 3 أيام مجانية (3 أيام VIP)' : '3 Days Free VIP (3 Days)'}
                  </h4>
                  <p className="text-[11px] text-amber-200/70 font-medium">
                    {isArabic ? 'اشتراك VIP كامل لثلاثة أيام' : 'Full VIP pass for 3 days'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4th to 10th Place */}
            <div className="bg-[#121216] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-white/10 text-white/80 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                {isArabic ? 'المراكز 4 إلى 10 🎖️' : 'RANKS 4TH - 10TH 🎖️'}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-yellow-400 font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-white/10">
                  4-10
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {isArabic ? 'باقة يوم واحد (1 يوم VIP)' : '1 Day Free VIP (1 Day)'}
                  </h4>
                  <p className="text-[11px] text-white/50 font-medium">
                    {isArabic ? 'اشتراك VIP مجاني لمدة 24 ساعة لـ 7 فائزين' : 'Free 24h VIP pass for 7 winners'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Quick Action Box */}
        <div className="bg-gradient-to-r from-red-950/80 via-red-900/40 to-[#121216] border border-red-500/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} />
              {isArabic ? 'انشر رابطك وارتقِ في الترتيب!' : 'Share Your Link & Rise Up!'}
            </span>
            <span className="text-[10px] text-yellow-300 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full">
              +250 {isArabic ? 'نقطة/إحالة' : 'Coins/Ref'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-white/10" dir="ltr">
            <input 
              type="text" 
              readOnly 
              value={refLink}
              className="bg-transparent text-xs text-white/90 font-mono flex-1 outline-none truncate px-1"
            />
            <button 
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 flex-none"
            >
              {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ' : 'Copy')}
            </button>
          </div>

          <button
            onClick={handleShareTelegram}
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <Share2 size={18} />
            {isArabic ? 'مشاركة رابط المسابقة عبر تلجرام' : 'Share Contest Link on Telegram'}
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={15} className="text-yellow-400" />
              {isArabic ? 'قائمة متصدري الإحالات هذا الأسبوع' : 'Weekly Leaderboard'}
            </h3>
            <span className="text-[10px] text-white/40">
              {isArabic ? 'تحديث مباشر' : 'Live Updates'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-white/40 text-xs">
              {isArabic ? 'جاري تحميل قائمة المتصدرين...' : 'Loading leaderboard...'}
            </div>
          ) : (
            <div className="space-y-2">
              {leaders.map((leader, index) => {
                const rank = index + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const isTop10 = rank >= 4 && rank <= 10;
                const isMe = leader.isCurrentUser || leader.id === currentUserId;

                return (
                  <div 
                    key={leader.id || index}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isMe 
                        ? 'bg-gradient-to-r from-yellow-950/60 via-[#1F1C16] to-[#141414] border-yellow-500/60 shadow-lg shadow-amber-500/10' 
                        : isTop1
                        ? 'bg-gradient-to-r from-amber-950/40 via-[#181815] to-[#121215] border-amber-500/40'
                        : 'bg-[#121216] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isTop1 
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-black shadow-md' 
                          : isTop2 
                          ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-black' 
                          : isTop3 
                          ? 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white' 
                          : 'bg-white/10 text-white/70'
                      }`}>
                        {isTop1 ? '👑' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${rank}`}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={leader.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.id}`} 
                          alt={leader.name}
                          className="w-8 h-8 rounded-full bg-white/5 object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {leader.name}
                            </span>
                            {isMe && (
                              <span className="text-[9px] bg-yellow-500 text-black font-black px-1.5 py-0.2 rounded-md">
                                {isArabic ? 'أنت' : 'YOU'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 block">
                            {getPrizeForRank(rank)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Referrals Count */}
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-amber-300" dir="ltr">
                        {leader.referralsCount}
                      </span>
                      <span className="text-[9px] text-white/40 uppercase">
                        {isArabic ? 'إحالة' : 'refs'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div 
            className="bg-[#121216] border border-amber-500/30 w-full max-w-md rounded-3xl p-5 relative flex flex-col gap-4 animate-in slide-in-from-bottom duration-300"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-yellow-400" />
                <h3 className="text-base font-black text-white">
                  {isArabic ? 'قوانين وشروط المسابقة' : 'Contest Rules'}
                </h3>
              </div>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-white/80 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-amber-400">1. احتساب الإحالات:</div>
                <p className="text-white/60">تحتسب الإحالة الناجحة عند قيام الصديق بالضغط على رابطك وتفعيل البوت/التطبيق لأول مرة.</p>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-amber-400">2. إعادة التعيين الأسبوعي:</div>
                <p className="text-white/60">تُحتسب نقاط مسابقة الأسبوع بانتظام وتُغلق النتائج نهاية كل يوم أسبوعي (الأحد منتصف الليل) لتبدأ دورة جديدة.</p>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-amber-400">3. توزيع الجوائز:</div>
                <p className="text-white/60">
                  - المركز الأول: باقة شهر VIP (30 يوم)<br />
                  - المركز الثاني: باقة أسبوع VIP (7 أيام)<br />
                  - المركز الثالث: باقة 3 أيام VIP<br />
                  - المراكز 4 إلى 10: باقة يوم واحد VIP
                </p>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-amber-400">4. الحسابات الوهمية:</div>
                <p className="text-white/60">يتم فحص وتدقيق الحسابات تلقائياً، وتُستبعد الحسابات الوهمية أو المتكررة لضمان النزاهة والعدالة بين الجميع.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 bg-yellow-500 text-black font-black text-xs rounded-xl shadow-md"
            >
              {isArabic ? 'فهمت ذلك' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Referral Hub Modal */}
      <ReferralHub 
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />
    </div>
  );
};

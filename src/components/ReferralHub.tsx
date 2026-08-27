import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, Users, Gift, Crown, CheckCircle2, Award, ChevronRight, Sparkles, X, Trophy } from 'lucide-react';
import { 
  getCurrentUserId, 
  getReferralLink, 
  getShareTelegramLink, 
  getUserReferrals, 
  REFERRAL_MILESTONES,
  getTelegramUser
} from '../services/referralService';
import { ReferralRecord } from '../types';
import { useAppStore } from '../store';

interface ReferralHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralHub: React.FC<ReferralHubProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { coins, addCoins } = useAppStore();

  const [userId, setUserId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [referralsCount, setReferralsCount] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const currentId = getCurrentUserId();
    setUserId(currentId);

    // Fetch referral data
    async function loadData() {
      setLoading(true);
      try {
        const records = await getUserReferrals(currentId);
        setReferrals(records);
        setReferralsCount(records.length);
        const total = records.reduce((acc, r) => acc + (r.rewardCoins || 250), 0);
        setEarnedCoins(total);

        // Load claimed milestones from localStorage fallback or user profile
        const saved = localStorage.getItem(`claimed_milestones_${currentId}`);
        if (saved) {
          setClaimedMilestones(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error loading referral stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const refLink = getReferralLink(userId);

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareTelegram = () => {
    const shareUrl = getShareTelegramLink(userId, isArabic);
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const handleClaimMilestone = (mId: string, bonusCoins: number, vipDays: number) => {
    if (claimedMilestones.includes(mId)) return;

    addCoins(bonusCoins);
    const updated = [...claimedMilestones, mId];
    setClaimedMilestones(updated);
    localStorage.setItem(`claimed_milestones_${userId}`, JSON.stringify(updated));

    const currentCoins = useAppStore.getState().coins;

    alert(
      isArabic
        ? `🎉 تهانينا! تمت مطالبة المكافأة بنجاح: +${bonusCoins} نقطة و +${vipDays} أيام VIP!\n💰 مجموع رصيد نقاطك الآن: ${currentCoins} نقطة.`
        : `🎉 Congratulations! Milestone claimed: +${bonusCoins} Coins and +${vipDays} Days VIP!\n💰 Total Coins Balance: ${currentCoins} coins.`
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div 
        className="bg-[#111111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 my-0 sm:my-auto"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-[#111] p-5 border-b border-white/10 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                {isArabic ? 'نظام الإحالة ودعوة الأصدقاء' : 'Referral & Invite Program'}
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xs text-white/60">
                {isArabic ? 'ربح نقاط مجانية واشتراكات VIP فورية' : 'Earn free coins & instant VIP access'}
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Weekly Contest Promo Button */}
          <div 
            onClick={() => {
              onClose();
              navigate('/weekly-contest');
            }}
            className="bg-gradient-to-r from-amber-950 via-yellow-900/90 to-[#181818] border border-amber-500/50 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 active:scale-98 transition-all shadow-lg shadow-amber-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-yellow-500 text-black rounded-xl flex items-center justify-center font-black shadow-md shrink-0">
                <Trophy size={22} className="fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-black text-white">
                    {isArabic ? 'المسابقة الأسبوعية للإحالات' : 'Weekly Referral Contest'}
                  </h3>
                  <span className="bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-md">
                    {isArabic ? 'جديد' : 'NEW'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/80 font-medium mt-0.5">
                  {isArabic ? 'اربح VIP مجاني من يوم إلى شهر كامل!' : 'Win free VIP from 1 day up to 1 full month!'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className={`text-amber-400 ${isArabic ? 'rotate-180' : ''}`} />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#181818] border border-white/5 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-1">
                <Users size={18} />
              </div>
              <span className="text-xl font-black text-white" dir="ltr">{referralsCount}</span>
              <span className="text-[10px] text-white/50 uppercase font-bold">
                {isArabic ? 'الأصدقاء المدعوون' : 'Invited Friends'}
              </span>
            </div>
            
            <div className="bg-[#181818] border border-yellow-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-1">
                <Gift size={18} />
              </div>
              <span className="text-xl font-black text-yellow-400" dir="ltr">+{earnedCoins}</span>
              <span className="text-[10px] text-white/50 uppercase font-bold">
                {isArabic ? 'أرباح الإحالات' : 'Referral Earnings'}
              </span>
            </div>
          </div>

          {/* Unique Referral Link Box */}
          <div className="bg-gradient-to-b from-[#1C1A17] to-[#141414] border border-amber-500/30 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crown size={14} />
                {isArabic ? 'رابط الإحالة الفريد الخاص بك' : 'Your Unique Referral Link'}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                +250 {isArabic ? 'نقطة/صديق' : 'Coins/Friend'}
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Share2 size={18} />
              {isArabic ? 'مشاركة مباشرة عبر تلجرام' : 'Share Directly on Telegram'}
            </button>
          </div>

          {/* How it works */}
          <div className="bg-[#161616] border border-white/5 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">
              {isArabic ? 'كيف يعمل نظام النقاط؟' : 'How the System Works'}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-base mb-1">📲</span>
                <span className="text-white font-bold">{isArabic ? '1. انشر رابطك' : '1. Share Link'}</span>
                <span className="text-white/40 text-[9px] mt-0.5">{isArabic ? 'مع أصدقائك' : 'With friends'}</span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-base mb-1">🎁</span>
                <span className="text-yellow-400 font-bold">{isArabic ? '2. يحصلون على +100' : '2. They Get +100'}</span>
                <span className="text-white/40 text-[9px] mt-0.5">{isArabic ? 'مكافأة ترحيب' : 'Welcome Bonus'}</span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-base mb-1">👑</span>
                <span className="text-green-400 font-bold">{isArabic ? '3. تحصل على +250' : '3. You Get +250'}</span>
                <span className="text-white/40 text-[9px] mt-0.5">{isArabic ? 'لكل إحالة ناجحة' : 'Per successful ref'}</span>
              </div>
            </div>
          </div>

          {/* Milestones Rewards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-yellow-500" />
              {isArabic ? 'مكافآت الإنجازات والتحديات' : 'Milestone Rewards'}
            </h3>

            <div className="space-y-2">
              {REFERRAL_MILESTONES.map((m) => {
                const isReached = referralsCount >= m.targetCount;
                const isClaimed = claimedMilestones.includes(m.id);

                return (
                  <div 
                    key={m.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isClaimed 
                        ? 'bg-[#141414] border-white/5 opacity-60' 
                        : isReached 
                        ? 'bg-gradient-to-r from-yellow-950/40 to-[#1A1A1A] border-yellow-500/50 shadow-lg' 
                        : 'bg-[#161616] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                        isReached ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/60'
                      }`}>
                        {m.targetCount}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {isArabic ? m.titleAr : m.titleEn}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {isArabic 
                            ? `التقدم الحالي: ${Math.min(referralsCount, m.targetCount)} / ${m.targetCount}`
                            : `Progress: ${Math.min(referralsCount, m.targetCount)} / ${m.targetCount}`}
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={!isReached || isClaimed}
                      onClick={() => handleClaimMilestone(m.id, m.rewardCoins, m.rewardVipDays)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                        isClaimed
                          ? 'bg-white/10 text-white/40 cursor-default'
                          : isReached
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:opacity-90 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed 
                        ? (isArabic ? 'تم الاستلام' : 'Claimed') 
                        : isReached 
                        ? (isArabic ? 'مطالبة الان' : 'Claim Now') 
                        : (isArabic ? 'مغلق' : 'Locked')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invited Friends List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">
              {isArabic ? 'قائمة الأصدقاء الذين سجلوا' : 'Invited Friends List'} ({referrals.length})
            </h3>

            {loading ? (
              <div className="text-center py-6 text-white/40 text-xs">
                {isArabic ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : referrals.length === 0 ? (
              <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 text-center text-white/40 text-xs">
                {isArabic ? 'لم تقم بدعوة أي صديق بعد. شارك رابطك وابدأ بكسب النقاط!' : 'No invited friends yet. Share your link and start earning!'}
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((r) => (
                  <div key={r.id} className="bg-[#161616] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 text-xs font-bold">
                        {r.referredName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{r.referredName}</div>
                        <div className="text-[9px] text-white/40">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg">
                      +{r.rewardCoins}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

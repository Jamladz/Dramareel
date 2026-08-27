import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Plus, Crown, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { PointsStoreModal } from './PointsStoreModal';
import { ReferralHub } from './ReferralHub';
import { TonPaymentModal } from './TonPaymentModal';

interface TopPointsBadgeProps {
  className?: string;
  showEarnButton?: boolean;
}

interface DeltaItem {
  id: string;
  value: number;
}

export const TopPointsBadge: React.FC<TopPointsBadgeProps> = ({ className = '', showEarnButton = true }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { coins, isVipActive, isPaidVip } = useAppStore();

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showTonModal, setShowTonModal] = useState(false);

  // Animated number state
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [deltas, setDeltas] = useState<DeltaItem[]>([]);
  const prevCoinsRef = useRef<number>(coins);

  // Smooth count animation and delta detection
  useEffect(() => {
    const prev = prevCoinsRef.current;
    if (prev !== coins) {
      const diff = coins - prev;
      prevCoinsRef.current = coins;

      // Add floating delta tag
      const deltaId = `${Date.now()}-${Math.random()}`;
      setDeltas(old => [...old, { id: deltaId, value: diff }]);

      // Remove delta after animation finishes
      setTimeout(() => {
        setDeltas(old => old.filter(item => item.id !== deltaId));
      }, 1500);

      // Smooth number animation (step count)
      const duration = 400; // ms
      const startTime = performance.now();
      const startVal = displayCoins;
      const endVal = coins;

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const current = Math.round(startVal + (endVal - startVal) * easeProgress);
        
        setDisplayCoins(current);

        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          setDisplayCoins(endVal);
        }
      };

      requestAnimationFrame(animateStep);
    }
  }, [coins]);

  return (
    <div className="relative inline-flex items-center shrink-0 max-w-full">
      {/* Floating Deltas (-50 or +250) */}
      <AnimatePresence>
        {deltas.map(d => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -20, scale: 1.05 }}
            exit={{ opacity: 0, y: -32, scale: 0.8 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono whitespace-nowrap shadow-md border flex items-center gap-0.5 ${
              d.value > 0
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-500/20'
            }`}
          >
            {d.value > 0 ? (
              <>
                <TrendingUp size={10} className="text-emerald-400" />
                <span>+{d.value.toLocaleString()}</span>
              </>
            ) : (
              <>
                <TrendingDown size={10} className="text-rose-400" />
                <span>{d.value.toLocaleString()}</span>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button 
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setShowPointsModal(true)}
        className={`group relative flex items-center gap-1.5 bg-gradient-to-r from-[#1A1714] via-[#241F18] to-[#1A1714] hover:from-[#241F18] hover:to-[#1F1A14] border border-amber-500/30 hover:border-amber-400/70 px-2.5 py-1 rounded-xl shadow-[0_2px_10px_rgba(245,158,11,0.12)] transition-all shrink-0 select-none ${className}`}
        title={isArabic ? 'رصيد نقاطك الشامل - اضغط للاستبدال أو كسب المزيد' : 'Total Points - Tap to redeem or earn'}
      >
        {/* Glowing Coin Icon */}
        <div className="relative w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-black font-black shadow-xs shadow-amber-500/30 shrink-0">
          <Coins size={12} className="fill-black text-black" />
          <Sparkles size={7} className="absolute -top-0.5 -right-0.5 text-yellow-100 animate-pulse" />
        </div>

        {/* Combined Points Counter */}
        <div className="flex items-center gap-1 font-mono leading-none" dir="ltr">
          <motion.span 
            key={displayCoins}
            initial={{ scale: 1.08, color: '#FBBF24' }}
            animate={{ scale: 1, color: '#FCD34D' }}
            transition={{ duration: 0.25 }}
            className="text-[11px] sm:text-xs font-black group-hover:text-yellow-300 tracking-tight"
          >
            {displayCoins.toLocaleString()}
          </motion.span>
          <span className="text-[9px] font-bold text-amber-400/80 hidden min-[340px]:inline">
            {isArabic ? 'نقطة' : 'pts'}
          </span>
        </div>

        {/* Plus / Action Icon */}
        {showEarnButton && (
          <div className="w-4 h-4 rounded-full bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-black flex items-center justify-center transition-colors shrink-0">
            <Plus size={10} strokeWidth={2.5} />
          </div>
        )}

        {/* VIP Crown Badge */}
        {isVipActive() && (
          <div className={`p-0.5 rounded-full shrink-0 ${isPaidVip() ? 'text-emerald-400' : 'text-amber-400'}`}>
            <Crown size={11} className="fill-current" />
          </div>
        )}
      </motion.button>

      {/* Main Points Store & Earn Modal */}
      <PointsStoreModal 
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onOpenTonModal={() => {
          setShowPointsModal(false);
          setShowTonModal(true);
        }}
      />

      {/* Referral Hub Modal */}
      <ReferralHub 
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />

      {/* TON Payment Modal */}
      <TonPaymentModal 
        isOpen={showTonModal}
        onClose={() => setShowTonModal(false)}
      />
    </div>
  );
};

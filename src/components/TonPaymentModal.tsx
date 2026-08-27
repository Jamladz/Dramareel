import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
  TonConnectButton, 
  useTonConnectUI, 
  useTonWallet, 
  useTonAddress 
} from '@tonconnect/ui-react';
import { X, Wallet, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Crown } from 'lucide-react';
import { TON_CONFIG } from '../config/tonConfig';
import { useAppStore } from '../store';

interface TonPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TonPaymentModal: React.FC<TonPaymentModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const wallet = useTonWallet();
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  
  const [selectedPkgId, setSelectedPkgId] = useState<string>(TON_CONFIG.PACKAGES[1].id);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingAutoPay, setPendingAutoPay] = useState<boolean>(false);

  // Auto trigger payment after user connects their wallet via TonConnect modal
  React.useEffect(() => {
    if (wallet && pendingAutoPay) {
      setPendingAutoPay(false);
      // Small timeout to allow TonConnect UI state to solidify
      setTimeout(() => {
        handlePayWithTon();
      }, 300);
    }
  }, [wallet, pendingAutoPay]);

  if (!isOpen) return null;

  const selectedPkg = TON_CONFIG.PACKAGES.find(p => p.id === selectedPkgId) || TON_CONFIG.PACKAGES[0];

  const openConnectModal = async () => {
    setErrorMsg(
      isArabic 
        ? '💡 جاري فتح نافذة الربط... اختر محفظتك (Tonkeeper أو Telegram Wallet)' 
        : '💡 Opening wallet connection... select your wallet (Tonkeeper or Telegram Wallet)'
    );

    // 1. Try SDK programmatic methods
    try {
      if (typeof (tonConnectUI as any)?.openModal === 'function') {
        await (tonConnectUI as any).openModal();
        return;
      }
      if (typeof (tonConnectUI as any)?.modal?.open === 'function') {
        await (tonConnectUI as any).modal.open();
        return;
      }
      if (typeof (tonConnectUI as any)?.connectWallet === 'function') {
        await (tonConnectUI as any).connectWallet();
        return;
      }
    } catch (err) {
      console.warn('TonConnect SDK openModal error:', err);
    }

    // 2. Fallback: Programmatically click the TonConnect button in the DOM
    try {
      const tcBtn = document.querySelector('.ton-connect-btn-wrapper button, tc-root button, [data-tc-button="true"]') as HTMLButtonElement;
      if (tcBtn) {
        tcBtn.click();
        return;
      }
    } catch (err) {
      console.warn('DOM button click fallback error:', err);
    }
  };

  const handlePayWithTon = async () => {
    if (!wallet) {
      setPendingAutoPay(true);
      await openConnectModal();
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setTxSuccess(null);

    try {
      // Calculate amount in nanotons (1 TON = 1,000,000,000 nanotons)
      const amountInNanotons = Math.floor(selectedPkg.tonPrice * 1000000000).toString();
      
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 mins
        messages: [
          {
            address: TON_CONFIG.RECEIVER_ADDRESS,
            amount: amountInNanotons,
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Grant Paid VIP (100% Ad-Free)
      const store = useAppStore.getState();
      store.activatePaidVip(selectedPkg.vipDays);

      setTxSuccess(result.boc ? result.boc.slice(0, 16) + '...' : 'Success');
    } catch (err: any) {
      console.error('TON Transaction Error:', err);
      if (err?.message?.includes('User rejects') || err?.message?.includes('Reject')) {
        setErrorMsg(isArabic ? 'تم إلغاء المعاملة من قبل المستخدم' : 'Transaction was cancelled by user');
      } else {
        setErrorMsg(isArabic ? 'فشلت المعاملة أو تمت إلغاؤها. حاول مرة أخرى' : 'Transaction failed or cancelled. Try again');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div 
        className="bg-[#121212] border border-amber-500/30 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-in slide-in-from-bottom duration-300 my-0 sm:my-auto"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-[#0098EA]/20 to-[#121212] p-5 border-b border-white/10 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 text-black font-black">
              <Crown size={24} className="fill-black" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                {isArabic ? 'اشتراك VIP مميز عبر TON' : 'Official VIP Pass via TON'}
                <Sparkles size={16} className="text-amber-400 animate-pulse" />
              </h2>
              <p className="text-xs text-amber-200/80">
                {isArabic ? 'مشاهدة غير محدودة لجميع الحلقات والمسلسلات' : 'Unlimited watching for all dramas & episodes'}
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

          {/* TonConnect Wallet Connection Status */}
          <div 
            onClick={() => {
              if (!wallet) openConnectModal();
            }}
            className={`bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl flex items-center justify-between transition-all ${
              !wallet ? 'cursor-pointer hover:border-[#0098EA]/50 active:scale-[0.99]' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0098EA]/10 border border-[#0098EA]/30 flex items-center justify-center text-[#0098EA]">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {wallet 
                    ? (isArabic ? 'المحفظة متصلة' : 'Wallet Connected') 
                    : (isArabic ? 'ربط محفظة TON (اضغط هنا للربط)' : 'Connect TON Wallet (Tap to connect)')}
                </p>
                <p className="text-[10px] text-white/50 font-mono">
                  {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : (isArabic ? 'Tonkeeper / Telegram Wallet' : 'Telegram Wallet')}
                </p>
              </div>
            </div>

            {/* Native TonConnect Button */}
            <div className="ton-connect-btn-wrapper" onClick={(e) => e.stopPropagation()}>
              <TonConnectButton />
            </div>
          </div>

          {/* Package Selection Title */}
          <div>
            <h3 className="text-xs font-black uppercase text-amber-400/90 tracking-wider mb-3">
              {isArabic ? 'اختر باقة VIP المناسبة:' : 'Select VIP Pass Duration:'}
            </h3>

            <div className="space-y-3">
              {TON_CONFIG.PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex items-center justify-between ${
                      isSelected 
                        ? 'bg-gradient-to-r from-amber-950/60 to-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
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
                        <p className="text-[11px] text-amber-300/80 font-medium">
                          {isArabic ? `مشاهدة مجانية بلا إعلانات لمدة ${pkg.vipDays} يوم` : `Ad-free unlimited watching for ${pkg.vipDays} days`}
                        </p>
                      </div>
                    </div>

                    <div className="text-left" dir="ltr">
                      <span className="text-base font-black text-[#0098EA] font-mono">
                        {pkg.tonPrice} TON
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error / Success Feedback */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-bold">
              {errorMsg}
            </div>
          )}

          {txSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs text-center font-bold space-y-2">
              <p className="text-sm font-black flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                {isArabic ? 'تم تفعيل اشتراك VIP بنجاح! 🎉' : 'VIP Pass Activated Successfully! 🎉'}
              </p>
              <p className="text-[10px] text-emerald-300/80 font-mono">
                {isArabic ? 'يمكنك الآن مشاهدة جميع الحلقات بدون إعلانات.' : 'You can now watch all episodes with zero ads.'}
              </p>
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-center gap-1.5 text-white/50 text-[11px] justify-center pt-1">
            <ShieldCheck size={14} className="text-[#0098EA]" />
            <span>{isArabic ? 'معاملة دفع آمنة وتلقائية عبر TON Connect' : 'Secure & automated payment via TON Connect'}</span>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-5 border-t border-white/10 bg-[#0D0D0D]">
          <button
            onClick={handlePayWithTon}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-3.5 px-6 rounded-2xl shadow-[0_4px_25px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin text-black" />
                <span>{isArabic ? 'جاري تأكيد شبكة TON...' : 'Confirming on TON Network...'}</span>
              </>
            ) : (
              <>
                <span>
                  {isArabic 
                    ? (wallet 
                        ? `تفعيل اشتراك VIP بـ (${selectedPkg.tonPrice} TON)` 
                        : `ربط المحفظة وتفعيل الاشتراك (${selectedPkg.tonPrice} TON)`)
                    : (wallet 
                        ? `Activate VIP Pass (${selectedPkg.tonPrice} TON)` 
                        : `Connect Wallet & Activate (${selectedPkg.tonPrice} TON)`)}
                </span>
                <ArrowRight size={18} className={isArabic ? 'rotate-180' : ''} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

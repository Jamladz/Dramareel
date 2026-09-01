import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Plus, X, Gift } from 'lucide-react';
import { getCurrentUserId } from '../services/referralService';
import { getTaskStatus, completeTelegramTask } from '../services/userService';
import { useAppStore } from '../store';

export const HomeScreenTaskModal: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { isHomeScreenModalOpen, openHomeScreenModal, closeHomeScreenModal } = useAppStore();
  const isVisible = isHomeScreenModalOpen;
  const setIsVisible = (val: boolean) => val ? openHomeScreenModal() : closeHomeScreenModal();
  const [addingToHome, setAddingToHome] = useState(false);
  const [msg, setMsg] = useState<{ text: string; success: boolean } | null>(null);
  const { addCoins } = useAppStore();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkStatus = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg || !tg.addToHomeScreen || !tg.checkHomeScreenStatus) {
        return; // Not supported, don't show
      }

      // Give the app a moment to load before popping up
      timeoutId = setTimeout(async () => {
        const userId = getCurrentUserId();
        if (!userId) return;
        const isCompleted = await getTaskStatus(userId, 'add_to_home_screen');
        if (!isCompleted) {
          setIsVisible(true);
        }
      }, 2500);
    };
    
    checkStatus();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleAddToHomeScreen = async () => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.addToHomeScreen || !tg.checkHomeScreenStatus) return;

    setAddingToHome(true);
    setMsg(null);
    
    try {
      tg.addToHomeScreen();
      
      setTimeout(() => {
        tg.checkHomeScreenStatus(async (status: string) => {
          if (status === 'added') {
            const userId = getCurrentUserId();
            const res = await completeTelegramTask(userId, 'add_to_home_screen', 200);
            if (res.success) {
              addCoins(200, 'إضافة التطبيق للشاشة الرئيسية');
              setMsg({ text: isArabic ? '🎉 تم إكمال المهمة! حصلت على +200 نقطة' : '🎉 Task completed! Earned +200 pts', success: true });
              setTimeout(() => {
                setIsVisible(false);
              }, 2000);
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
      }, 5000);

    } catch (error) {
      setMsg({ text: 'Error interacting with Telegram API', success: false });
      setAddingToHome(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => setIsVisible(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 inset-x-0 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-t border-white/10 rounded-t-[32px] z-[9999] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col"
            style={{ maxHeight: '60vh' }}
          >
            <div className="flex-none p-4 flex justify-center">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 relative">
                <Smartphone size={40} strokeWidth={1.5} />
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                  <Gift size={12} /> +200
                </div>
              </div>

              <h2 className="text-xl font-black text-white mb-3">
                {isArabic ? 'أضف التطبيق إلى الشاشة الرئيسية' : 'Add to Home Screen'}
              </h2>
              
              <p className="text-sm text-white/60 leading-relaxed max-w-xs mb-8">
                {isArabic 
                  ? 'أضف اختصار التطبيق إلى شاشة هاتفك للوصول إليه بسرعة في أي وقت واحصل على مكافأة فورية!' 
                  : 'Add the app shortcut to your home screen for quick access anytime and get an instant reward!'}
              </p>

              {msg && (
                <div className={`w-full p-3 rounded-xl mb-4 text-xs font-bold ${
                  msg.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {msg.text}
                </div>
              )}

              <button
                onClick={handleAddToHomeScreen}
                disabled={addingToHome || msg?.success}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {addingToHome ? (
                  isArabic ? 'جارِ التحقق من الإضافة...' : 'Verifying addition...'
                ) : (
                  <>
                    <Plus size={20} />
                    {isArabic ? 'إضافة الاختصار والمكافأة' : 'Add Shortcut & Claim'}
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setIsVisible(false)}
                className="mt-5 text-xs font-bold text-white/40 hover:text-white/60 transition-colors"
              >
                {isArabic ? 'ليس الآن' : 'Not now'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

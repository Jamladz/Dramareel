import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Play, Trash2, Clock, History as HistoryIcon, ArrowRight } from 'lucide-react';
import { TopPointsBadge } from '../components/TopPointsBadge';

export const History = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, history, clearHistory } = useAppStore();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  const historyItems = Object.values(history)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(h => ({
      ...h,
      movie: movies.find(m => m.id === h.movieId)!
    }))
    .filter(h => h.movie);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return isArabic ? 'الآن' : 'Just now';
    if (diff < 3600) return isArabic ? `منذ ${Math.floor(diff / 60)} دقيقة` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isArabic ? `منذ ${Math.floor(diff / 3600)} ساعة` : `${Math.floor(diff / 3600)}h ago`;
    return isArabic ? `منذ ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#070709] flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Sticky Header Bar */}
      <div className="flex-none px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#070709]/85 backdrop-blur-xl z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <Clock size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {isArabic ? 'سجل المشاهدة' : 'Watch History'}
              </h1>
              <p className="text-[11px] text-white/45">
                {isArabic 
                  ? `تمت متابعة ${historyItems.length} مسلسل` 
                  : `${historyItems.length} watched dramas tracked`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      clearHistory();
                      setConfirmClear(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-extrabold active:scale-95 transition-all"
                  >
                    {isArabic ? 'تأكيد المسح' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs font-bold"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-bold active:scale-95 transition-all"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">{isArabic ? 'مسح السجل' : 'Clear History'}</span>
                </button>
              )
            )}
            <TopPointsBadge />
          </div>
        </div>
      </div>

      {/* History Items Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-28 hide-scrollbar">
        <div className="max-w-3xl mx-auto">
          {historyItems.length > 0 ? (
            <div className="space-y-3">
              {historyItems.map(({ movie, percentage, episodeNumber, episodeId, updatedAt }) => {
                const epNum = episodeNumber || 1;
                const targetEpId = episodeId || (movie.episodes && movie.episodes[epNum - 1] ? movie.episodes[epNum - 1].id : undefined);
                const targetUrl = targetEpId ? `/watch/${movie.id}?ep=${targetEpId}` : `/watch/${movie.id}`;

                return (
                  <div 
                    key={movie.id} 
                    onClick={() => navigate(targetUrl)}
                    className="group flex gap-3.5 bg-[#121217] hover:bg-[#17171F] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all p-3 border border-white/[0.07] hover:border-red-500/35 shadow-lg relative"
                  >
                    {/* Poster / Cover Image */}
                    <div className="w-28 sm:w-36 aspect-[16/10] rounded-xl overflow-hidden relative shrink-0 bg-neutral-900 border border-white/10">
                      <img 
                        src={movie.coverImage || movie.largeImage} 
                        alt={movie.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all">
                        <div className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play size={16} className="fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Progress Bar Overlay on Cover */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80">
                        <div 
                          className="h-full bg-red-600 rounded-r-full shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Movie Info & Episode Progress */}
                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-red-400 transition-colors" title={movie.title}>
                            {movie.title}
                          </h3>
                          <span className="text-[10px] text-white/40 font-mono shrink-0 tabular-nums">
                            {formatTimeAgo(updatedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-amber-400 font-bold">
                            {isArabic ? `الحلقة ${epNum}` : `Episode ${epNum}`}
                          </span>
                          <span className="text-white/25">·</span>
                          <span className="text-[11px] text-white/50 font-mono tabular-nums">
                            {Math.round(percentage)}% {isArabic ? 'مكتمل' : 'Watched'}
                          </span>
                        </div>
                      </div>

                      {/* Resume Bar & Arrow Button */}
                      <div className="flex items-center justify-between gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                            style={{ width: `${Math.max(5, percentage)}%` }}
                          />
                        </div>

                        <span className="text-xs font-extrabold text-red-400 group-hover:text-red-300 flex items-center gap-1 shrink-0">
                          <span>{isArabic ? 'متابعة' : 'Resume'}</span>
                          <ArrowRight size={13} className={isArabic ? 'rotate-180' : ''} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-white/30 py-20 space-y-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                <HistoryIcon size={30} />
              </div>
              <p className="font-bold text-sm text-white/60">
                {isArabic ? 'سجل المشاهدة فارغ' : 'Your watch history is empty'}
              </p>
              <p className="text-xs text-white/35 max-w-xs">
                {isArabic ? 'عندما تبدأ في مشاهدة المسلسلات، سيظهر تقدمك وحلقاتك هنا لمتابعتها بسهولة' : 'When you start watching dramas, your episode progress will be saved here for easy resuming.'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 active:scale-95 transition-all"
              >
                {isArabic ? 'ابدأ المشاهدة الآن' : 'Start Watching'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



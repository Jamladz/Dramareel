import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Play, Trash2, Clock, History as HistoryIcon, ArrowRight } from 'lucide-react';

export const History = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { movies, history, clearHistory } = useAppStore();
  const navigate = useNavigate();

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
    <div className="h-full w-full overflow-hidden bg-[#050505] flex flex-col p-4 sm:p-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <div className="flex-none flex items-center justify-between mb-5 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            {isArabic ? 'سجل المشاهدة' : 'Watch History'}
            <Clock size={18} className="text-red-500" />
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {isArabic 
              ? `تم مشاهدة ${historyItems.length} مسلسل ومتابعة تقدمك` 
              : `${historyItems.length} watched dramas tracked`}
          </p>
        </div>

        {historyItems.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm(isArabic ? 'هل تريد مسح سجل المشاهدة بالكامل؟' : 'Clear entire watch history?')) {
                clearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold active:scale-95 transition-all"
          >
            <Trash2 size={14} />
            <span>{isArabic ? 'مسح السجل' : 'Clear History'}</span>
          </button>
        )}
      </div>

      {/* History Items Container */}
      <div className="flex-1 overflow-y-auto pb-28 hide-scrollbar">
        {historyItems.length > 0 ? (
          <div className="space-y-3.5">
            {historyItems.map(({ movie, percentage, episodeNumber, episodeId, updatedAt }) => {
              const epNum = episodeNumber || 1;
              const targetEpId = episodeId || (movie.episodes && movie.episodes[epNum - 1] ? movie.episodes[epNum - 1].id : undefined);
              const targetUrl = targetEpId ? `/watch/${movie.id}?ep=${targetEpId}` : `/watch/${movie.id}`;

              return (
                <div 
                  key={movie.id} 
                  onClick={() => navigate(targetUrl)}
                  className="group flex gap-3.5 bg-[#141414] hover:bg-[#1A1A1A] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all p-3 border border-white/5 hover:border-red-500/30 shadow-lg relative"
                >
                  {/* Poster / Cover Image */}
                  <div className="w-28 sm:w-36 aspect-[16/10] rounded-xl overflow-hidden relative flex-shrink-0 bg-neutral-900 border border-white/10">
                    <img 
                      src={movie.coverImage || movie.largeImage} 
                      alt={movie.title} 
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
                        <h3 className="text-xs sm:text-sm font-extrabold text-white truncate" title={movie.title}>
                          {movie.title}
                        </h3>
                        <span className="text-[10px] text-white/40 font-mono flex-shrink-0">
                          {formatTimeAgo(updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-red-600/20 border border-red-500/30 text-red-400 font-bold text-[10px]">
                          {isArabic ? `الحلقة ${epNum}` : `Episode ${epNum}`}
                        </span>
                        <span className="text-[10px] text-white/50 font-mono font-bold">
                          {Math.round(percentage)}% {isArabic ? 'مكتمل' : 'Watched'}
                        </span>
                      </div>
                    </div>

                    {/* Resume Bar & Arrow Button */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden mr-3">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>

                      <span className="text-[11px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1">
                        <span>{isArabic ? 'متابعة' : 'Resume'}</span>
                        <ArrowRight size={12} className={isArabic ? 'rotate-180' : ''} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-white/30 h-64 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
              <HistoryIcon size={32} />
            </div>
            <p className="font-bold text-sm text-white/50">
              {isArabic ? 'سجل المشاهدة فارغ' : 'Your watch history is empty'}
            </p>
            <p className="text-xs text-white/30 max-w-xs text-center">
              {isArabic ? 'عندما تبدأ في مشاهدة المسلسلات، سيظهر تقدمك وحلقاتك هنا لمتابعتها بسهولة' : 'When you start watching dramas, your episode progress will be saved here for easy resuming.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


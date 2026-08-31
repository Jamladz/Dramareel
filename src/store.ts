import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movie, UserProfile, WatchHistoryItem, CoinTransaction } from './types';

interface AppState {
  user: UserProfile | null;
  movies: Movie[];
  favorites: string[];
  history: Record<string, WatchHistoryItem>;
  coins: number;
  hasJoinedTelegram: boolean;
  transactions: CoinTransaction[];
  unlockedEpisodes: string[];
  watchedHours: number;
  moviesCount: number;
  seriesCount: number;
  streakDays: number;
  lastDailyReward: number | null;
  lastAdWatch: number | null;
  premiumUntil: number | null;
  vipType: 'paid' | 'points' | null;
  completedEpisodes: string[];
  clearFavorites: () => void;
  setJoinedTelegram: () => void;
  clearHistory: () => void;
  setUser: (user: UserProfile | null) => void;
  setMovies: (movies: Movie[]) => void;
  toggleFavorite: (movieId: string) => void;
  updateHistory: (movieId: string, item: WatchHistoryItem) => void;
  addCoins: (amount: number, reason?: string) => void;
  setCoinsFromServer: (coins: number) => void;
  spendCoins: (amount: number, reason?: string) => boolean;
  unlockEpisode: (episodeId: string) => void;
  claimDailyReward: () => { success: boolean; reward: number; streak: number };
  claimAdReward: () => boolean;
  setPremiumUntil: (timestamp: number, type?: 'paid' | 'points') => void;
  completeEpisode: (episodeId: string) => void;
  buyVipPass: (days: number, cost: number) => boolean;
  buyPointsVipPass: (days: number, cost: number) => boolean;
  activatePaidVip: (days: number) => void;
  isVipActive: () => boolean;
  isPaidVip: () => boolean;
  isPointsVip: () => boolean;
  getTotalCoinsEarned: () => number;
}

const STREAK_REWARDS = [50, 70, 100, 120, 150, 200, 300];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      movies: [],
      favorites: [],
      history: {},
      coins: 0,
      hasJoinedTelegram: false,
      transactions: [],
      unlockedEpisodes: [],
      watchedHours: 0,
      moviesCount: 0,
      seriesCount: 0,
      streakDays: 0,
      lastDailyReward: null,
      lastAdWatch: null,
      premiumUntil: null,
      vipType: null,
      completedEpisodes: [],
      setJoinedTelegram: () => set({ hasJoinedTelegram: true }),
      clearFavorites: () => set({ favorites: [] }),
  clearHistory: () => set({ history: {} }),
  setUser: (user) => set({ user }),
      setMovies: (movies) => set({ movies }),
      toggleFavorite: (movieId) => set((state) => {
        const isFav = state.favorites.includes(movieId);
        return {
          favorites: isFav 
            ? state.favorites.filter(id => id !== movieId)
            : [...state.favorites, movieId]
        };
      }),
      updateHistory: (movieId, item) => set((state) => ({
        history: {
          ...state.history,
          [movieId]: item
        }
      })),
      addCoins: (amount, reason = 'إضافة نقاط') => set((state) => {
        const newTransaction: CoinTransaction = {
          id: Math.random().toString(36).substring(2, 9),
          type: 'earn',
          amount,
          reason,
          timestamp: Date.now()
        };
        return {
          coins: state.coins + amount,
          transactions: [newTransaction, ...state.transactions].slice(0, 50)
        };
      }),
      spendCoins: (amount, reason = 'خصم نقاط') => {
        let success = false;
        set((state) => {
          if (state.coins >= amount) {
            success = true;
            const newTransaction: CoinTransaction = {
              id: Math.random().toString(36).substring(2, 9),
              type: 'spend',
              amount,
              reason,
              timestamp: Date.now()
            };
            return { 
              coins: state.coins - amount,
              transactions: [newTransaction, ...state.transactions].slice(0, 50)
            };
          }
          return state;
        });
        return success;
      },
      unlockEpisode: (episodeId) => set((state) => {
        if (!state.unlockedEpisodes.includes(episodeId)) {
          return { unlockedEpisodes: [...state.unlockedEpisodes, episodeId] };
        }
        return state;
      }),
      claimDailyReward: () => {
        const state = get();
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (state.lastDailyReward && (now - state.lastDailyReward < oneDayMs)) {
          return { success: false, reward: 0, streak: state.streakDays };
        }

        let newStreak = 1;
        if (state.lastDailyReward && (now - state.lastDailyReward < oneDayMs * 2)) {
          newStreak = state.streakDays + 1;
        }

        const rewardIndex = Math.min(newStreak - 1, STREAK_REWARDS.length - 1);
        const rewardAmount = STREAK_REWARDS[rewardIndex];

        get().addCoins(rewardAmount, `مكافأة تسجيل دخول (اليوم ${newStreak})`);
        set({ streakDays: newStreak, lastDailyReward: now });

        return { success: true, reward: rewardAmount, streak: newStreak };
      },
      claimAdReward: () => {
        const state = get();
        const now = Date.now();
        const cooldown = 3 * 60 * 1000; // 3 minutes cooldown
        if (!state.lastAdWatch || now - state.lastAdWatch >= cooldown) {
          get().addCoins(30, 'مشاهدة إعلان قصير');
          set({ lastAdWatch: now });
          return true;
        }
        return false;
      },
      setPremiumUntil: (timestamp: number, type: 'paid' | 'points' = 'paid') => set({ premiumUntil: timestamp, vipType: type }),
      completeEpisode: (episodeId: string) => {
        set((state) => {
          if (state.completedEpisodes.includes(episodeId)) {
            return state;
          }
          get().addCoins(10, 'إكمال مشاهدة حلقة');
          return { 
            completedEpisodes: [...state.completedEpisodes, episodeId]
          };
        });
      },
      buyPointsVipPass: (days: number, cost: number) => {
        const state = get();
        const success = get().spendCoins(cost, `اشتراك VIP بالنقاط لمدة ${days} يوم`);
        if (success) {
          const currentExpiry = state.premiumUntil && state.premiumUntil > Date.now() ? state.premiumUntil : Date.now();
          const additionalTime = days * 24 * 60 * 60 * 1000;
          set({ premiumUntil: currentExpiry + additionalTime, vipType: 'points' });
          return true;
        }
        return false;
      },
      buyVipPass: (days: number, cost: number) => {
        return get().buyPointsVipPass(days, cost);
      },
      activatePaidVip: (days: number) => {
        const state = get();
        const currentExpiry = state.premiumUntil && state.premiumUntil > Date.now() ? state.premiumUntil : Date.now();
        const additionalTime = days * 24 * 60 * 60 * 1000;
        set({ premiumUntil: currentExpiry + additionalTime, vipType: 'paid' });
      },
      isVipActive: () => {
        const state = get();
        return Boolean(state.premiumUntil && state.premiumUntil > Date.now());
      },
      isPaidVip: () => {
        const state = get();
        return Boolean(state.premiumUntil && state.premiumUntil > Date.now() && state.vipType === 'paid');
      },
      isPointsVip: () => {
        const state = get();
        return Boolean(state.premiumUntil && state.premiumUntil > Date.now() && state.vipType === 'points');
      },
      getTotalCoinsEarned: () => {
        const state = get();
        return state.transactions
          .filter(t => t.type === 'earn')
          .reduce((sum, t) => sum + t.amount, 0);
      }
    }),
    {
      name: 'drama-reel-storage',
      partialize: (state) => ({ 
        coins: state.coins, 
        transactions: state.transactions,
        unlockedEpisodes: state.unlockedEpisodes,
        favorites: state.favorites,
        history: state.history,
        streakDays: state.streakDays,
        lastDailyReward: state.lastDailyReward,
        lastAdWatch: state.lastAdWatch,
        premiumUntil: state.premiumUntil,
        vipType: state.vipType,
        completedEpisodes: state.completedEpisodes
      }),
    }
  )
);


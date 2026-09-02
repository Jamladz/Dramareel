export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration?: number;
  isLongEpisode?: boolean;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  largeImage?: string;
  gallery?: string[];
  trailerUrl?: string;
  videoUrl: string; // URL for HLS or standard mp4
  episodes?: Episode[];
  releaseYear: number;
  duration: number; // in minutes
  episodesCount: number;
  rating: number;
  views: number;
  category: string;
  country: string;
  language: string;
  director?: string;
  cast?: string[];
  tags?: string[];
  createdAt: number;
}

export interface UserProfile {
  id: string;
  telegramId?: string;
  name: string;
  username: string;
  photoUrl: string;
  watchedHours: number;
  moviesCount: number;
  seriesCount: number;
  favoritesCount: number;
  streakDays: number;
  coins: number;
  subscription: 'free' | 'premium';
  lastLoginAt: number;
  referredBy?: string;
  referralsCount?: number;
  earnedReferralCoins?: number;
  claimedMilestones?: string[];
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredId: string;
  referredName: string;
  rewardCoins: number;
  createdAt: number;
}

export interface ReferralMilestone {
  id: string;
  targetCount: number;
  rewardCoins: number;
  rewardVipDays: number;
  titleAr: string;
  titleEn: string;
}

export interface WatchHistoryItem {
  movieId: string;
  episodeId?: string;
  episodeNumber?: number;
  lastWatchedMinute: number;
  percentage: number;
  updatedAt: number;
}

export interface CoinTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  timestamp: number;
}

export interface ContestLeader {
  id: string;
  name: string;
  referralsCount: number;
  rank?: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

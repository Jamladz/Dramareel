import { Movie } from './types';

export const MOCK_MOVIES: Movie[] = [
  {
    id: "1",
    title: "Shadows of Destiny",
    description: "A young warrior uncovers a secret that could destroy the world.",
    coverImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
    largeImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574267432553-4b4047f3b584?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    releaseYear: 2026,
    duration: 120,
    episodesCount: 1,
    rating: 4.8,
    views: 120500,
    category: "Action",
    country: "USA",
    language: "English",
    director: "Jane Doe",
    cast: ["John Smith", "Alice Wonderland"],
    createdAt: Date.now()
  },
  {
    id: "2",
    title: "Cyberpunk: Neon Nights",
    description: "In a futuristic city, a hacker fights against a corrupt megacorporation.",
    coverImage: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    largeImage: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    episodes: [
      { id: "e1", episodeNumber: 1, title: "The Hack", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: "e2", episodeNumber: 2, title: "Discovery", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: "e3", episodeNumber: 3, title: "The Chase", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: "e4", episodeNumber: 4, title: "Final Stand", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
    ],
    releaseYear: 2025,
    duration: 5,
    episodesCount: 4,
    rating: 4.9,
    views: 850000,
    category: "Sci-Fi",
    country: "Japan",
    language: "Japanese",
    createdAt: Date.now() - 86400000
  },
  {
    id: "3",
    title: "The Silent Echo",
    description: "A psychological thriller about a detective losing her mind.",
    coverImage: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=800&q=80",
    largeImage: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    episodes: [
      { id: "e1", episodeNumber: 1, title: "The Crime", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: "e2", episodeNumber: 2, title: "Clues", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
    ],
    releaseYear: 2024,
    duration: 3,
    episodesCount: 2,
    rating: 4.5,
    views: 320000,
    category: "Mystery",
    country: "UK",
    language: "English",
    createdAt: Date.now() - 172800000
  },
  {
    id: "4",
    title: "Galactic Romance",
    description: "Two lovers from warring planets try to find peace.",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    largeImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    episodes: [
      { id: "e1", episodeNumber: 1, title: "Meeting", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: "e2", episodeNumber: 2, title: "Conflict", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: "e3", episodeNumber: 3, title: "Resolution", videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
    ],
    releaseYear: 2026,
    duration: 2,
    episodesCount: 3,
    rating: 4.7,
    views: 500000,
    category: "Romance",
    country: "South Korea",
    language: "Korean",
    createdAt: Date.now()
  }
];

// TON Crypto Payment Configuration (Exclusive VIP Subscriptions)

export const TON_CONFIG = {
  // Merchant TON Wallet Address where payments will be sent automatically
  RECEIVER_ADDRESS: 'UQCTZAMbXoN5T43K9gJXH8GYWBmIstXrUrdoV9kv3btN1Ad3',
  
  // Exclusive VIP Subscription Packages payable with TON
  PACKAGES: [
    {
      id: 'vip_1day',
      titleAr: 'اشتراك VIP يوم واحد (بدون إعلانات)',
      titleEn: '1 Day VIP Pass (Zero Ads)',
      vipDays: 1,
      tonPrice: 0.5,
      popular: false,
      badgeAr: 'تجربة يوم',
      badgeEn: '1-Day Trial',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'vip_3days',
      titleAr: 'اشتراك VIP 3 أيام',
      titleEn: '3 Days VIP Pass',
      vipDays: 3,
      tonPrice: 2.0,
      popular: false,
      badgeAr: '3 أيام VIP',
      badgeEn: '3 Days VIP',
      color: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'vip_7days',
      titleAr: 'اشتراك VIP 7 أيام (أسبوع)',
      titleEn: '7 Days VIP Pass (1 Week)',
      vipDays: 7,
      tonPrice: 4.0,
      popular: true,
      badgeAr: 'الأكثر طلباً 🔥',
      badgeEn: 'Most Popular 🔥',
      color: 'from-amber-500 via-yellow-500 to-orange-500',
    },
    {
      id: 'vip_30days',
      titleAr: 'اشتراك VIP شهر واحد (30 يوم)',
      titleEn: '1 Month VIP Pass (30 Days)',
      vipDays: 30,
      tonPrice: 8.0,
      popular: false,
      badgeAr: 'توفير كامل 👑',
      badgeEn: 'Full Month 👑',
      color: 'from-purple-600 to-pink-600',
    }
  ]
};

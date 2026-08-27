import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      home: "Home",
      forYou: "For You",
      search: "Search",
      favorites: "Favorites",
      history: "History",
      profile: "Profile",
      continueWatching: "Continue Watching",
      trendingToday: "Trending Today",
      newReleases: "New Releases",
      mostPopular: "Most Popular",
      play: "Play",
      watch: "Watch",
      addToFavorites: "Add to Favorites",
      similarWorks: "Similar Works",
      searchPlaceholder: "Search movies, series...",
      settings: "Settings",
      language: "Language",
      coins: "Coins",
      streak: "Day Streak",
      premium: "Premium",
      free: "Free",
      views: "Views",
      episodes: "Episodes",
      duration: "min",
      cast: "Cast",
      director: "Director",
      year: "Year",
      premiumSubscription: "Premium (Ad-Free)",
      connectWalletFirst: "Please connect your TON wallet first!",
      subscriptionSuccess: "Successfully subscribed to Premium!",
      transactionFailed: "Transaction failed or canceled.",
      "1DayPlan": "1 Day Access",
      "7DaysPlan": "7 Days Access",
      "30DaysPlan": "1 Month Access"
    }
  },
  ar: {
    translation: {
      home: "الرئيسية",
      forYou: "لك",
      search: "بحث",
      favorites: "المفضلة",
      history: "سجل المشاهدة",
      profile: "حسابي",
      continueWatching: "متابعة المشاهدة",
      trendingToday: "شائع اليوم",
      newReleases: "إصدارات جديدة",
      mostPopular: "الأكثر شعبية",
      play: "تشغيل",
      watch: "مشاهدة",
      addToFavorites: "أضف للمفضلة",
      similarWorks: "أعمال مشابهة",
      searchPlaceholder: "ابحث عن أفلام، مسلسلات...",
      settings: "الإعدادات",
      language: "اللغة",
      coins: "العملات",
      streak: "أيام متتالية",
      premium: "مميز",
      free: "مجاني",
      views: "مشاهدة",
      episodes: "حلقات",
      duration: "المدة",
      minutes: "دقيقة",
      cast: "الممثلون",
      director: "المخرج",
      year: "السنة",
      adminPanel: "لوحة التحكم",
      moviesManagement: "إدارة الأفلام",
      addMovie: "إضافة فيلم",
      newMovieDetails: "تفاصيل الفيلم الجديد",
      movieName: "اسم الفيلم",
      description: "الوصف",
      coverImage: "رابط صورة الغلاف",
      categoryHint: "التصنيف (مثال: أكشن)",
      saveMovie: "حفظ الفيلم",
      addEpisode: "إضافة حلقة",
      episodeNumber: "رقم الحلقة",
      episodeTitle: "عنوان الحلقة",
      videoUrl: "رابط الفيديو (mp4 أو m3u8)",
      saveEpisode: "حفظ الحلقة",
      cancel: "إلغاء",
      episodesList: "قائمة الحلقات",
      noEpisodes: "لا توجد حلقات مضافة بعد.",
      deleteMovieTitle: "حذف الفيلم؟",
      deleteMovieConfirm: "لا يمكن التراجع عن هذا الإجراء. ستتم إزالة جميع الحلقات أيضاً.",
      delete: "حذف",
      loading: "جاري التحميل...",
      noContent: "لا يوجد محتوى متاح",
      goToAdmin: "الذهاب للوحة التحكم",
      viewAll: "عرض الكل",
      save: "حفظ",
      share: "مشاركة",
      all: "الكل",
      noResults: "لم يتم العثور على نتائج.",
      noFavorites: "لا توجد مفضلة بعد.",
      noHistory: "لا يوجد سجل مشاهدة بعد.",
      watched: "ساعات المشاهدة",
      movies: "أفلام",
      series: "مسلسلات",
      changeLanguage: "تغيير اللغة",
      inviteFriends: "دعوة الأصدقاء",
      adminDashboard: "لوحة تحكم المسؤول",
      adminOnly: "للمسؤولين فقط",
      durationInput: "المدة (بالدقائق)",
      english: "إنجليزي",
      dubbed: "مدبلج",
      arabic: "عربي",
      editMovie: "تعديل الفيلم",
      editEpisode: "تعديل الحلقة",
      saveChanges: "حفظ التغييرات",
      premiumSubscription: "الاشتراك المميز (بدون إعلانات)",
      connectWalletFirst: "يرجى ربط محفظة TON أولاً!",
      subscriptionSuccess: "تم الاشتراك في الخدمة المميزة بنجاح!",
      transactionFailed: "فشلت المعاملة أو تم إلغاؤها.",
      "1DayPlan": "وصول لمدة يوم واحد",
      "7DaysPlan": "وصول لمدة 7 أيام",
      "30DaysPlan": "وصول لمدة شهر واحد"
    }
  },
  ru: {
    translation: {
      home: "Главная",
      search: "Поиск",
      favorites: "Избранное",
      history: "История",
      profile: "Профиль",
      continueWatching: "Продолжить просмотр",
      trendingToday: "В тренде сегодня",
      newReleases: "Новинки",
      mostPopular: "Самые популярные",
      play: "Играть",
      watch: "Смотреть",
      addToFavorites: "В избранное",
      similarWorks: "Похожие",
      searchPlaceholder: "Поиск фильмов, сериалов...",
      settings: "Настройки",
      language: "Язык",
      coins: "Монеты",
      streak: "Дней подряд",
      premium: "Премиум",
      free: "Бесплатно",
      views: "Просмотров",
      episodes: "Эпизодов",
      duration: "мин",
      cast: "В ролях",
      director: "Режиссер",
      year: "Год"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ar", // default
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Set initial direction
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

export default i18n;

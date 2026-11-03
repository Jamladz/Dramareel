import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Gift, Heart, PlayCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

export const BottomNav = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isArabic = i18n.language === 'ar';

  const navItems = [
    { to: "/", icon: Home, label: t('home') },
    { to: "/tasks", icon: Gift, label: t('tasks', 'المهام') },
    { to: "/favorites", icon: Heart, label: t('favorites') },
    { to: "/history", icon: PlayCircle, label: t('history') },
    { to: "/profile", icon: User, label: t('profile') },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-5 inset-x-0 z-50 flex justify-center px-3 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <nav 
        dir={isArabic ? 'rtl' : 'ltr'}
        className="pointer-events-auto w-full max-w-md bg-[#0E0E12]/90 backdrop-blur-2xl px-2 py-1.5 rounded-3xl border border-white/10 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(229,9,20,0.08)]"
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.to === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-200 select-none group"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0.5 bg-gradient-to-b from-red-600/20 to-red-600/5 border border-red-500/30 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                />
              )}
              <div className={`relative z-10 transition-transform duration-200 ${isActive ? 'text-red-500 -translate-y-0.5 scale-105' : 'text-white/45 group-hover:text-white/80 group-active:scale-95'}`}>
                <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`relative z-10 text-[10px] font-bold tracking-tight whitespace-nowrap transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-white/45 group-hover:text-white/75'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};


import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Flame, Heart, PlayCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BottomNav = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: "/", icon: <Home size={22} />, label: t('home') },
    { to: "/foryou", icon: <Flame size={22} />, label: t('forYou', 'For You') },
    { to: "/favorites", icon: <Heart size={22} />, label: t('favorites') },
    { to: "/history", icon: <PlayCircle size={22} />, label: t('history') },
    { to: "/profile", icon: <User size={22} />, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-[#121212]/90 backdrop-blur-2xl px-2 sm:px-5 py-2 rounded-full border border-white/10 flex items-center justify-around shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 transition-all duration-300 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-0.5 transition-all duration-300 relative px-2 py-1 rounded-full ${
              isActive 
                ? 'text-red-500 scale-105 font-black' 
                : 'text-white/40 hover:text-white/80 active:scale-95'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {item.icon}
              <span className="text-[9px] sm:text-[10px] font-bold tracking-tight uppercase whitespace-nowrap">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};


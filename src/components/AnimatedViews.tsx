import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedViewsProps {
  baseViews: number;
  className?: string;
  iconSize?: number;
}

export const AnimatedViews: React.FC<AnimatedViewsProps> = ({ baseViews, className = "", iconSize = 14 }) => {
  // Add 1,000,000 as requested, plus the base views for randomness
  const [currentViews, setCurrentViews] = useState(1000000 + baseViews);

  useEffect(() => {
    // Start interval to dynamically increase the views
    // to simulate real-time watching
    const intervalId = setInterval(() => {
      // Randomly add between 1 and 7 views every 2-5 seconds
      const increment = Math.floor(Math.random() * 7) + 1;
      setCurrentViews(prev => prev + increment);
    }, Math.floor(Math.random() * 3000) + 2000);

    return () => clearInterval(intervalId);
  }, []);

  // Format with commas to see the live animation clearly
  const formatViews = (val: number) => {
    return val.toLocaleString();
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Eye size={iconSize} className="text-white/70" />
      <div className="relative overflow-hidden h-[1.2em] min-w-[5rem] flex items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentViews}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute font-mono font-medium tracking-tight"
          >
            {formatViews(currentViews)}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

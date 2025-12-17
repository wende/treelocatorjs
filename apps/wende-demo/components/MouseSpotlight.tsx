import React, { useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const MouseSpotlight: React.FC = () => {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Center the 400px spotlight
      mouseX.set(e.clientX - 200);
      mouseY.set(e.clientY - 200);
      
      // Set global CSS variables for edge shimmer
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
        {/* Primary Spotlight - Darkened for Light Mode */}
        <motion.div
            className="fixed top-0 left-0 w-[400px] h-[400px] bg-purple-500 rounded-full blur-[100px] pointer-events-none z-50 mix-blend-multiply opacity-15"
            style={{ x, y }}
        />
        {/* Secondary colored glow for depth */}
         <motion.div
            className="fixed top-0 left-0 w-[300px] h-[300px] bg-blue-500 rounded-full blur-[120px] pointer-events-none z-50 mix-blend-multiply opacity-10"
            style={{ x, y }}
        />
    </>
  );
};
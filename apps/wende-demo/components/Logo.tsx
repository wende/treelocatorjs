import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC = () => {
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.2, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }
    }
  };

  return (
    <motion.div
      className="w-12 h-12 relative flex items-center justify-center bg-black cursor-pointer overflow-hidden group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
      >
        <motion.path
          d="M10 6 L22 22 M10 22 L16 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
        />
      </svg>
    </motion.div>
  );
};

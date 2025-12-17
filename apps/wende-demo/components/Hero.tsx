import React from 'react';
import { CV_DATA } from '../constants';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { AnimatedHeading } from './AnimatedHeading';

export const Hero: React.FC = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-20 relative overflow-hidden bg-off-white">
      {/* Background Abstract Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 opacity-50 skew-x-12 hidden lg:block pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10">
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <p className="text-sm md:text-base tracking-[0.3em] uppercase text-gray-500 mb-4 font-bold">
                Portfolio 2024
            </p>
            <div className="text-5xl md:text-8xl lg:text-9xl font-display font-bold leading-tight tracking-tighter text-black mb-8">
                <div className="mb-2 md:mb-4">
                    <AnimatedHeading text="KRZYSZTOF" />
                </div>
                <div className="text-gray-400">
                    <AnimatedHeading text="WENDE" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-2xl"
        >
             <h2 className="text-xl md:text-2xl font-light text-gray-800 mb-8 leading-relaxed">
                {CV_DATA.title}
             </h2>
             <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 mb-12">
                 <span className="px-4 py-2 border border-gray-200 bg-white shadow-sm">Forbes 25 under 25</span>
                 <span className="px-4 py-2 border border-gray-200 bg-white shadow-sm">Elixir Specialist</span>
                 <span className="px-4 py-2 border border-gray-200 bg-white shadow-sm">Systems Architect</span>
             </div>
             
             <div className="prose prose-lg text-gray-500">
                {CV_DATA.tldr.slice(0, 2).map((text, i) => (
                    <p key={i} className="mb-4">{text}</p>
                ))}
             </div>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={() => document.getElementById('expertise')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <ArrowDown className="text-black w-8 h-8" />
      </motion.div>
    </section>
  );
};
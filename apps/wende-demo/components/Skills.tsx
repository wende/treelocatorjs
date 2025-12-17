import React from 'react';
import { CV_DATA } from '../constants';
import { motion } from 'framer-motion';
import { AnimatedHeading } from './AnimatedHeading';

export const Skills: React.FC = () => {
  return (
    <section id="expertise" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-4xl md:text-6xl font-display font-bold tracking-tight">
            <AnimatedHeading text="EXPERTISE" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {CV_DATA.skills.map((skillGroup, idx) => (
                <motion.div 
                    key={skillGroup.category}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-6"
                >
                    <h3 className="text-xl font-bold uppercase tracking-widest border-b-2 border-black pb-4">
                        {skillGroup.category}
                    </h3>
                    <ul className="space-y-3">
                        {skillGroup.items.map((item) => (
                            <li key={item} className="flex items-center text-gray-700 hover:text-black transition-colors duration-200">
                                <span className="w-1.5 h-1.5 bg-black mr-3" />
                                <span className="text-lg">{item}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};
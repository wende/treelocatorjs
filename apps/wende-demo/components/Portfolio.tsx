import React from 'react';
import { CV_DATA } from '../constants';
import { motion } from 'framer-motion';
import { ExternalLink, Star, Award, TrendingUp, GitFork } from 'lucide-react';
import { AnimatedHeading } from './AnimatedHeading';

const iconMap = {
    "Cicada": GitFork,
    "Elchemy": Star,
    "Autocomplete Elixir": ExternalLink,
    "Forbes 25 under 25": Award,
    "Stack Overflow": TrendingUp,
    "Quora": TrendingUp,
};

export const Portfolio: React.FC = () => {
  return (
    <section id="portfolio" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div className="text-4xl md:text-6xl font-display font-bold tracking-tight">
                <AnimatedHeading text="SELECTED WORKS" />
            </div>
            <p className="text-gray-400 mt-4 md:mt-0 max-w-sm text-right hidden md:block">
                A showcase of open source contributions, awards, and impactful startups.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CV_DATA.portfolio.map((item, index) => {
                // Determine icon safely
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const IconComponent = (iconMap as any)[item.name.split(',')[0]] || Star;
                
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-charcoal border border-gray-800 p-8 hover:bg-white hover:text-black transition-colors duration-500 ease-in-out cursor-default overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                           <IconComponent className="w-12 h-12" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold font-display mb-2 flex items-center gap-2">
                                    {item.name}
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    )}
                                </h3>
                                <div className="w-12 h-1 bg-white group-hover:bg-black mb-6 transition-colors duration-500" />
                                <p className="text-gray-400 group-hover:text-gray-600 mb-4 font-light">
                                    {item.description}
                                </p>
                            </div>
                            
                            {item.stats && (
                                <div className="mt-4 pt-4 border-t border-gray-700 group-hover:border-gray-200">
                                    <p className="font-mono text-xs uppercase tracking-wider">{item.stats}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>
    </section>
  );
};
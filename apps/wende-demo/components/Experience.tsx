import React from 'react';
import { CV_DATA } from '../constants';
import { motion } from 'framer-motion';
import { AnimatedHeading } from './AnimatedHeading';

export const Experience: React.FC = () => {
  return (
    <section id="experience" className="py-24 bg-off-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 flex md:justify-start">
             <div className="text-4xl md:text-6xl font-display font-bold tracking-tight text-right md:text-left">
                <AnimatedHeading text="WORK HISTORY" />
             </div>
        </div>

        <div className="relative border-l-2 border-gray-200 ml-4 md:ml-8 space-y-16">
            {CV_DATA.experience.map((job, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-8 md:pl-16"
                >
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-4 border-black transition-transform duration-300 hover:scale-150" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Header Info */}
                        <div className="lg:col-span-4">
                            <h3 className="text-2xl font-bold font-display">{job.role}</h3>
                            <h4 className="text-lg font-medium text-gray-600 mb-1">{job.company}</h4>
                            <p className="text-sm uppercase tracking-wide text-gray-400">{job.period} | {job.location}</p>
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-8 bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                            <p className="mb-4 text-gray-700 leading-relaxed">{job.description}</p>
                            {job.responsibilities.length > 0 && (
                                <ul className="space-y-2">
                                    {job.responsibilities.map((res, i) => (
                                        <li key={i} className="flex items-start text-sm text-gray-600">
                                            <span className="mr-2 mt-1.5 min-w-[4px] h-[4px] bg-black rounded-full" />
                                            {res}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};
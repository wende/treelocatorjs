import React from 'react';
import { CV_DATA } from '../constants';
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';
import { AnimatedHeading } from './AnimatedHeading';

export const Contact: React.FC = () => {
  return (
    <section id="contact" className="bg-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
            <div>
                <div className="text-4xl md:text-6xl font-display font-bold mb-8 tracking-tight">
                    <AnimatedHeading text="GET IN TOUCH" />
                </div>
                <p className="text-xl text-gray-600 mb-8 max-w-md">
                    Looking for a distributed systems architect or functional programming expert? Let's discuss how I can help.
                </p>
                
                <div className="space-y-6">
                    <a href={`mailto:${CV_DATA.contact.email}`} className="flex items-center text-lg font-medium hover:text-gray-600 transition-colors">
                        <Mail className="mr-4 w-6 h-6" />
                        {CV_DATA.contact.email}
                    </a>
                    <div className="flex items-center text-lg font-medium text-gray-800">
                        <Phone className="mr-4 w-6 h-6" />
                        {CV_DATA.contact.phone}
                    </div>
                    <div className="flex items-center text-lg font-medium text-gray-800">
                        <MapPin className="mr-4 w-6 h-6" />
                        {CV_DATA.contact.location}
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-center space-y-8">
                <div className="bg-off-white p-8 border border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-400">Socials</h3>
                    <div className="flex space-x-6">
                        <a href={`https://linkedin.com/in/${CV_DATA.contact.linkedin}`} target="_blank" rel="noreferrer" className="group flex items-center space-x-3 text-black hover:text-gray-600 transition-colors">
                            <Linkedin className="w-8 h-8" />
                            <span className="font-bold text-lg">LinkedIn</span>
                        </a>
                        <a href={`https://github.com/${CV_DATA.contact.github}`} target="_blank" rel="noreferrer" className="group flex items-center space-x-3 text-black hover:text-gray-600 transition-colors">
                            <Github className="w-8 h-8" />
                            <span className="font-bold text-lg">GitHub</span>
                        </a>
                    </div>
                </div>

                <div className="bg-off-white p-8 border border-gray-100">
                     <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-400">Interests</h3>
                     <div className="flex flex-wrap gap-2">
                        {CV_DATA.hobbies.map(hobby => (
                            <span key={hobby} className="px-3 py-1 bg-white border border-gray-200 text-sm text-gray-600">
                                {hobby}
                            </span>
                        ))}
                     </div>
                </div>
            </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
            <p className="mb-2 md:mb-0">
                &copy; {new Date().getFullYear()} {CV_DATA.name}. All rights reserved.
            </p>
            <p className="text-center md:text-right max-w-lg">
                I hereby consent to the processing of this CV and the personal data contained within, by anyone who receives this document for the sole purpose of considering my application for employment opportunities.
            </p>
        </div>
      </div>
    </section>
  );
};
import React, { useRef } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({ text, className = "", size = 'lg' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const words = text.split(' ');
  let charCount = 0;

  return (
    <div
      ref={ref}
      className={`animated-heading flex flex-wrap gap-x-[0.5em] gap-y-4 ${isInView ? 'is-visible' : ''} ${className}`}
      aria-label={text}
      style={{ fontSize: 'inherit' }}
    >
      {words.map((word, wordIndex) => (
        <div key={wordIndex} className="flex">
          {word.split('').map((char, charIndex) => {
             const index = charCount++;
             const textId = `letter-shape-${text.replace(/\s/g, '-')}-${wordIndex}-${charIndex}`;
             const clipId = `letter-clip-${text.replace(/\s/g, '-')}-${wordIndex}-${charIndex}`;

             return (
               <div key={charIndex} className="relative h-[1.1em] w-[0.7em]">
                 <svg
                    viewBox="0 0 70 90"
                    className="w-full h-full overflow-visible"
                    style={{ fontKerning: 'normal' }}
                 >
                    <g className="letter" style={{ '--order': index } as React.CSSProperties}>
                        {/* Primary text element with ID for reference */}
                        <text
                            id={textId}
                            className="outline-1"
                            x="35"
                            y="70"
                            textAnchor="middle"
                            fontFamily="'Montserrat', sans-serif"
                            fontWeight="400"
                            fontSize="64"
                            style={char.toUpperCase() === 'W' ? { strokeDasharray: 500, strokeDashoffset: 500 } : undefined}
                        >
                            {char}
                        </text>
                        <text
                            className="outline-2"
                            x="35"
                            y="70"
                            textAnchor="middle"
                            fontFamily="'Montserrat', sans-serif"
                            fontWeight="400"
                            fontSize="64"
                            style={char.toUpperCase() === 'W' ? { strokeDasharray: 500, strokeDashoffset: 500 } : undefined}
                        >
                            {char}
                        </text>
                        <text
                            className="outline-3"
                            x="35"
                            y="70"
                            textAnchor="middle"
                            fontFamily="'Montserrat', sans-serif"
                            fontWeight="400"
                            fontSize="64"
                            style={char.toUpperCase() === 'W' ? { strokeDasharray: 500, strokeDashoffset: 500 } : undefined}
                        >
                            {char}
                        </text>

                        {/* Clip Path Definition using use href */}
                        <defs>
                            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                                <use href={`#${textId}`} />
                            </clipPath>
                        </defs>

                        {/* Fills */}
                        <g clipPath={`url(#${clipId})`}>
                             <rect className="fill-band fill-1" x="-55" y="-20" width="180" height="160" />
                             <rect className="fill-band fill-2" x="-55" y="-20" width="180" height="160" />
                             <rect className="fill-band fill-3" x="-55" y="-20" width="180" height="160" />
                        </g>
                    </g>
                 </svg>
               </div>
             );
          })}
        </div>
      ))}
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';

// Nested components to demonstrate TreeLocatorJS ancestry chain
function RothkoSquare({ id }: { id: string }) {
  return <div id={id} className="w-[50px] h-[50px] bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer transition-transform hover:scale-110" />;
}

function RothkoCore() {
  return (
    <div className="flex gap-5" id="rothko-core-container">
      <RothkoSquare id="rothko-square-1" />
      <RothkoSquare id="rothko-square-2" />
      <RothkoSquare id="rothko-square-3" />
    </div>
  );
}

function RothkoLayer3({ children }: { children: React.ReactNode }) {
  return (
    <div id="rothko-layer-3" className="flex items-center justify-center w-[270px] h-[140px] bg-white/[0.12] border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:border-white/30">
      {children}
    </div>
  );
}

function RothkoLayer2({ children }: { children: React.ReactNode }) {
  return (
    <div id="rothko-layer-2" className="flex items-center justify-center w-[370px] h-[240px] bg-white/[0.08] border border-white/15 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:border-white/40">
      {children}
    </div>
  );
}

function RothkoLayer1({ children }: { children: React.ReactNode }) {
  return (
    <div id="rothko-layer-1" className="flex items-center justify-center w-[470px] h-[340px] bg-white/[0.05] backdrop-blur-sm border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:border-white/20">
      {children}
    </div>
  );
}

function RothkoStructure({ visible }: { visible: boolean }) {
  return (
    <div id="rothko-structure" className={`flex items-center justify-center transition-all duration-1000 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <RothkoLayer1>
        <RothkoLayer2>
          <RothkoLayer3>
            <RothkoCore />
          </RothkoLayer3>
        </RothkoLayer2>
      </RothkoLayer1>
    </div>
  );
}

const Arrow = ({ visible }: { visible: boolean }) => (
  <div className={`absolute bottom-24 right-5 w-12 h-16 flex justify-center items-end z-40 pointer-events-none transition-opacity duration-500 ${visible ? 'opacity-100 animate-bounce' : 'opacity-0'}`}>
    <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
      <line x1="20" y1="0" x2="20" y2="45" stroke="white" strokeWidth="1" />
      <path d="M10 35 L20 50 L30 35 L20 42 Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  </div>
);

const Ripple = ({ id }: { x: number; y: number; id: number }) => (
  <div
    key={id}
    className="fixed rounded-full bg-white/20 border border-white/40 pointer-events-none z-[100]"
    style={{
      width: 50,
      height: 50,
      right: 5,
      bottom: 5,
      animation: 'ripple 0.8s ease-out forwards',
    }}
  />
);

const GridBackground = ({ visible }: { visible: boolean }) => (
  <div
    className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
    style={{
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}
  />
);

const AltKeyIcon = () => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative inline-flex items-end justify-start w-[72px] h-[72px] p-2 bg-gradient-to-b from-[#3a3a3a] to-[#1a1a1a] border border-[#4a4a4a] rounded-lg shadow-[0_4px_0_#0a0a0a,0_6px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[0_1px_0_#0a0a0a] active:translate-y-[3px] transition-all">
      {isMac ? (
        <>
          <span className="absolute top-1.5 right-2 text-[11px] text-white/50">⌥</span>
          <span className="text-sm text-white/90 font-light">option</span>
        </>
      ) : (
        <span className="text-base text-white/90 font-medium">Alt</span>
      )}
    </div>
  );
};

const TextDisplay = ({ heading, subtext, shiftedUp, animKey, elementPath, showGithub, showAltKey }: { heading: string; subtext: string; shiftedUp: boolean; animKey: number; elementPath?: string; showGithub?: boolean; showAltKey?: boolean }) => (
  <div className={`absolute inset-0 flex items-center justify-center z-20 text-center max-w-lg mx-auto px-6 pointer-events-none transition-transform duration-1000 ${shiftedUp ? '-translate-y-[30vh]' : ''}`}>
    <div key={animKey} className="animate-fadeIn">
      <h1 className="text-2xl md:text-3xl font-light tracking-widest text-white">
        {heading}
      </h1>
      <p className="mt-4 text-xs md:text-sm text-gray-500 tracking-wider font-light">
        {subtext}
      </p>
      {showAltKey && (
        <div className="mt-4 flex justify-center">
          <AltKeyIcon />
        </div>
      )}
      {elementPath && (
        <pre className="mt-6 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-left inline-block">
          <code className="text-xs text-white/80 whitespace-pre">{elementPath}</code>
        </pre>
      )}
      <a
        href="https://github.com/wende/treelocatorjs"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 mt-6 px-4 py-2 bg-[#24292e] text-white text-sm font-medium rounded-md hover:bg-[#2f363d] transition-all duration-500 border border-[#444c56] ${showGithub ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        View on GitHub
      </a>
    </div>
  </div>
);

export const TreeLocatorDemo = () => {
  const [step, setStep] = useState(0);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [locatorActive, setLocatorActive] = useState(false);
  const [elementPath, setElementPath] = useState<string>('');
  const [showGithub, setShowGithub] = useState(false);
  const hasAdvancedToStep3 = useRef(false);
  const wasLocatorActive = useRef(false);
  const lastClickedElement = useRef<HTMLElement | null>(null);

  // Hide/show TreeLocatorJS button based on step
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'locator-hide-style';
    style.innerHTML = `#locatorjs-wrapper { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.5s ease !important; }`;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById('locator-hide-style');
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    const style = document.getElementById('locator-hide-style');
    if (style) {
      if (step >= 1) {
        style.innerHTML = `#locatorjs-wrapper { opacity: 1 !important; pointer-events: auto !important; transition: opacity 0.5s ease !important; }`;
      } else {
        style.innerHTML = `#locatorjs-wrapper { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.5s ease !important; }`;
      }
    }
  }, [step]);

  // Watch for TreeLocatorJS activation
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const hasActiveClass = document.body.classList.contains('locatorjs-active-pointer');
          if (hasActiveClass && !locatorActive && step === 1) {
            // TreeLocatorJS was just activated - create ripple and advance to step 2
            const id = Date.now();
            setRipples(r => [...r, { x: 0, y: 0, id }]);
            setTimeout(() => setRipples(r => r.filter(ripple => ripple.id !== id)), 1000);
            setStep(2);
          }
          setLocatorActive(hasActiveClass);
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, [locatorActive, step]);

  // Capture clicks to store the clicked element
  useEffect(() => {
    if (step !== 2) return;

    const captureClick = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement) {
        lastClickedElement.current = e.target;
      }
    };

    // Use capture phase to get the element before TreeLocatorJS stops propagation
    document.addEventListener('click', captureClick, { capture: true });
    return () => document.removeEventListener('click', captureClick, { capture: true });
  }, [step]);

  // Listen for element selection in step 2 - detect when locator deactivates after a click
  useEffect(() => {
    // Detect transition from active to inactive (user clicked to select)
    if (step === 2 && wasLocatorActive.current && !locatorActive && !hasAdvancedToStep3.current) {
      const checkAndAdvance = async () => {
        // Try to get tree from TreeLocatorJS API using the clicked element
        const win = window as unknown as {
          __treelocator__?: {
            getPath?: (el: HTMLElement | string) => string | null;
            getAncestry?: (el: HTMLElement | string) => Array<{ componentName?: string; elementName?: string }> | null;
          };
          __locatorjs__?: {
            getPath?: (el: HTMLElement | string) => string | null;
            getAncestry?: (el: HTMLElement | string) => Array<{ componentName?: string; elementName?: string }> | null;
          };
        };
        const api = win.__treelocator__ || win.__locatorjs__;
        let treePath: string | null = null;

        if (api && lastClickedElement.current) {
          // Try getPath first, then getAncestry
          if (api.getPath) {
            treePath = api.getPath(lastClickedElement.current);
          }
          if (!treePath && api.getAncestry) {
            const ancestry = api.getAncestry(lastClickedElement.current);
            if (ancestry && ancestry.length > 0) {
              treePath = ancestry.map(a => a.componentName || a.elementName || '?').join('\n→ ');
            }
          }
        }

        // Only advance if we got a valid tree path from the API (no clipboard fallback here)
        if (treePath) {
          hasAdvancedToStep3.current = true;
          setElementPath(treePath);
          setStep(3);
          setTimeout(() => setShowGithub(true), 1000);
        }
      };

      // Small delay to let TreeLocatorJS finish
      setTimeout(checkAndAdvance, 100);
    }

    // Update the ref after checking
    wasLocatorActive.current = locatorActive;
  }, [locatorActive, step]);

  // Also listen for alt+click directly
  useEffect(() => {
    if (step !== 2 || hasAdvancedToStep3.current) return;

    const handleAltClick = (e: MouseEvent) => {
      if (!e.altKey) return;
      if (!(e.target instanceof HTMLElement)) return;

      const clickedElement = e.target;

      // Small delay to let TreeLocatorJS process
      setTimeout(async () => {
        if (hasAdvancedToStep3.current) return;

        const win = window as unknown as {
          __treelocator__?: {
            getPath?: (el: HTMLElement | string) => string | null;
            getAncestry?: (el: HTMLElement | string) => Array<{ componentName?: string; elementName?: string }> | null;
          };
          __locatorjs__?: {
            getPath?: (el: HTMLElement | string) => string | null;
            getAncestry?: (el: HTMLElement | string) => Array<{ componentName?: string; elementName?: string }> | null;
          };
        };
        const api = win.__treelocator__ || win.__locatorjs__;
        let treePath: string | null = null;

        if (api) {
          if (api.getPath) {
            treePath = api.getPath(clickedElement);
          }
          if (!treePath && api.getAncestry) {
            const ancestry = api.getAncestry(clickedElement);
            if (ancestry && ancestry.length > 0) {
              treePath = ancestry.map(a => a.componentName || a.elementName || '?').join('\n→ ');
            }
          }
        }

        // Fallback: try reading from clipboard
        if (!treePath) {
          try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText && clipboardText.includes('→')) {
              treePath = clipboardText;
            }
          } catch {
            // Clipboard access denied
          }
        }

        // Only advance if we got a valid tree path
        if (treePath) {
          hasAdvancedToStep3.current = true;
          setElementPath(treePath);
          setStep(3);
          setTimeout(() => setShowGithub(true), 1000);
        }
      }, 200);
    };

    document.addEventListener('click', handleAltClick, { capture: true });
    return () => document.removeEventListener('click', handleAltClick, { capture: true });
  }, [step]);

  const handleStartClick = () => {
    if (step === 0) {
      setStep(1);
    }
  };

  const getStepText = () => {
    switch (step) {
      case 0:
        return { heading: 'TREELOCATORJS', subtext: 'Click anywhere to begin.' };
      case 1:
        return { heading: 'ACTIVATE', subtext: 'Click the tree icon below or press Alt.' };
      case 2:
        return { heading: 'SELECT', subtext: 'Click any element to reveal its ancestry.' };
      case 3:
        return { heading: "THAT'S IT", subtext: 'Component tree copied to clipboard.' };
      default:
        return { heading: 'TREELOCATORJS', subtext: '' };
    }
  };

  const { heading, subtext } = getStepText();

  return (
    <div
      className="h-screen w-screen flex items-center justify-center select-none bg-black overflow-hidden fixed inset-0"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      onClick={step === 0 ? handleStartClick : undefined}
    >
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(8); opacity: 0; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        html, body { overflow: hidden !important; }
      `}</style>
      <GridBackground visible={step >= 1} />
      <TextDisplay heading={heading} subtext={subtext} shiftedUp={step >= 2 && step < 3} animKey={step} elementPath={step === 3 ? elementPath : undefined} showGithub={showGithub} showAltKey={step === 1} />
      <RothkoStructure visible={step === 2} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[100]">
        {ripples.map(({ x, y, id }) => (
          <Ripple key={id} x={x} y={y} id={id} />
        ))}
      </div>
      <Arrow visible={step === 1} />
    </div>
  );
};

export default TreeLocatorDemo;

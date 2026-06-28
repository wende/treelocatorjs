import React, { useEffect, useState } from 'react';

type ExploreMoreDemoProps = {
  onBack: () => void;
};

function JitterBadge() {
  return (
    <div
      id="anomaly-jitter-badge"
      className="demo-jitter inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-medium"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      Jitter
    </div>
  );
}

function JumpCard() {
  return (
    <div
      id="anomaly-jump-card"
      className="demo-jump w-full h-24 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-200 text-sm font-medium"
    >
      Jump
    </div>
  );
}

function FlickerDot() {
  return (
    <div className="flex items-center justify-center h-24">
      <div
        id="anomaly-flicker-dot"
        className="demo-flicker w-16 h-16 rounded-full bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]"
        title="Flicker"
      />
    </div>
  );
}

function LayoutShiftBox() {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setWide((w) => !w), 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      id="anomaly-layout-shift-box"
      className="h-24 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-200 text-sm font-medium transition-all duration-300"
      style={{ width: wide ? '100%' : '55%' }}
    >
      Layout shift
    </div>
  );
}

const ANOMALY_CARDS = [
  {
    id: 'jitter',
    title: 'Jitter & shiver',
    description: 'Micro-oscillations in transform — common with spring animations or subpixel rounding.',
    Component: JitterBadge,
    hint: 'Record the badge while it animates.',
  },
  {
    id: 'jump',
    title: 'Jump',
    description: 'Sudden position leaps — scroll snapping, layout reflow, or bad easing.',
    Component: JumpCard,
    hint: 'Record the card; the jump fires every few seconds.',
  },
  {
    id: 'flicker',
    title: 'Flicker',
    description: 'Rapid opacity changes — hydration flashes, loading states, or z-index fights.',
    Component: FlickerDot,
    hint: 'Record the glowing dot.',
  },
  {
    id: 'layout',
    title: 'Layout shift',
    description: 'Bounding-box changes — dynamic content, ads, or responsive reflow.',
    Component: LayoutShiftBox,
    hint: 'Record the box; width toggles on a timer.',
  },
] as const;

export function ExploreMoreDemo({ onBack }: ExploreMoreDemoProps) {
  useEffect(() => {
    const style = document.getElementById('locator-hide-style');
    if (style) {
      style.innerHTML = `#locatorjs-wrapper { opacity: 1 !important; pointer-events: auto !important; transition: opacity 0.5s ease !important; }`;
    }

    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-black text-white select-none"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <style>{`
        @keyframes demo-jitter {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(-2px, 1px); }
          60% { transform: translate(1px, 2px); }
          80% { transform: translate(-1px, -1px); }
        }
        @keyframes demo-jump {
          0%, 82%, 100% { transform: translateY(0); }
          88% { transform: translateY(-56px); }
          94% { transform: translateY(4px); }
        }
        @keyframes demo-flicker {
          0%, 45%, 55%, 100% { opacity: 1; }
          50% { opacity: 0.08; }
        }
        .demo-jitter { animation: demo-jitter 0.12s linear infinite; }
        .demo-jump { animation: demo-jump 4s ease-in-out infinite; }
        .demo-flicker { animation: demo-flicker 0.35s step-end infinite; }
      `}</style>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mb-1">TreeLocatorJS</p>
            <h1 className="text-lg font-light tracking-widest">Anomaly playground</h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 px-4 py-2 text-xs tracking-wider uppercase border border-white/20 rounded-lg hover:border-white/40 hover:bg-white/5 transition-colors"
          >
            ← Back to intro
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <h2 className="text-sm tracking-widest uppercase text-white/90">How to record</h2>
          <ol className="text-xs text-gray-400 space-y-2 leading-relaxed list-decimal list-inside">
            <li>Hover the tree icon (bottom-right) and click the <span className="text-red-400">red record</span> button.</li>
            <li>Click one of the anomaly elements below to start recording.</li>
            <li>Let the animation run for a few seconds, then click record again to stop.</li>
            <li>Review findings — jumps, flicker, jitter, and layout shifts are flagged automatically.</li>
          </ol>
          <p className="text-[11px] text-gray-500 pt-1">
            Tip: open the settings cog on the pill to tune thresholds or toggle visual-diff snapshots.
          </p>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          {ANOMALY_CARDS.map(({ id, title, description, Component, hint }) => (
            <article
              key={id}
              id={`anomaly-card-${id}`}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4 hover:border-white/20 transition-colors"
            >
              <div>
                <h3 className="text-sm tracking-wide text-white/90 mb-1">{title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{description}</p>
              </div>
              <div className="flex-1 flex items-center justify-center py-2">
                <Component />
              </div>
              <p className="text-[10px] text-gray-600 tracking-wide">{hint}</p>
            </article>
          ))}
        </div>

        <section className="rounded-xl border border-dashed border-white/15 p-5 text-center">
          <p className="text-xs text-gray-500 tracking-wide">
            Alt+click any element here to copy its component path — same as the intro demo.
          </p>
        </section>
      </main>
    </div>
  );
}

export default ExploreMoreDemo;

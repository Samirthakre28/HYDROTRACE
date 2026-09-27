import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface StartupAnimationProps {
  onComplete?: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  // Check prefers-reduced-motion
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Phases:
  // 1: 0.0 - 0.3s (Dark navy + digital forensic grid)
  // 2: 0.3 - 0.8s (Transaction nodes & graph lines animate)
  // 3: 0.8 - 1.2s (Graph converges, HydroTrace title appears)
  // 4: 1.2 - 1.5s (Fade out overlay into main UI)
  // 5: 1.5s+ (Unmounted)
  const [phase, setPhase] = useState<number>(1);
  const [isMounted, setIsMounted] = useState<boolean>(true);

  useEffect(() => {
    // If reduced motion is requested, finish immediately
    if (prefersReduced) {
      setIsMounted(false);
      onComplete?.();
      return;
    }

    // Phase 2 at 300ms: Nodes & edges appear
    const t1 = setTimeout(() => {
      setPhase(2);
    }, 300);

    // Phase 3 at 800ms: Convergence & Title reveal
    const t2 = setTimeout(() => {
      setPhase(3);
    }, 800);

    // Phase 4 at 1200ms: Fade out overlay
    const t3 = setTimeout(() => {
      setPhase(4);
    }, 1200);

    // Phase 5 at 1500ms: Complete and unmount
    const t4 = setTimeout(() => {
      setPhase(5);
      setIsMounted(false);
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [prefersReduced, onComplete]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Loading HydroTrace application"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070B14] overflow-hidden select-none transition-opacity duration-300 ease-out ${
        phase >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Subtle Digital Forensic Grid Background (0.0-0.3s+) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out pointer-events-none ${
          phase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radial Dark Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(11, 20, 38, 0.4) 0%, #070B14 75%)',
        }}
      />

      {/* Center Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-4 text-center">
        
        {/* Transaction Graph Animation (0.3s - 0.8s, converges at 0.8s - 1.2s) */}
        <div
          className={`relative w-full max-w-[340px] sm:max-w-[400px] h-[180px] sm:h-[210px] flex items-center justify-center transition-all duration-400 ease-in-out ${
            phase >= 3
              ? 'scale-50 opacity-0 -translate-y-2 pointer-events-none'
              : phase >= 2
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-1'
          }`}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 360 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Connecting Edges with subtle glow */}
            <g
              className={`transition-opacity duration-500 ease-out ${
                phase >= 2 ? 'opacity-80' : 'opacity-0'
              }`}
            >
              {/* Edge 0 -> 1 */}
              <line
                x1="60"
                y1="90"
                x2="140"
                y2="45"
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              {/* Edge 0 -> 2 */}
              <line
                x1="60"
                y1="90"
                x2="140"
                y2="135"
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              {/* Edge 1 -> 3 */}
              <line
                x1="140"
                y1="45"
                x2="225"
                y2="60"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.5"
              />
              {/* Edge 2 -> 4 */}
              <line
                x1="140"
                y1="135"
                x2="225"
                y2="120"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.5"
              />
              {/* Edge 3 -> 5 */}
              <line
                x1="225"
                y1="60"
                x2="300"
                y2="90"
                stroke="rgba(16, 185, 129, 0.5)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              {/* Edge 4 -> 5 */}
              <line
                x1="225"
                y1="120"
                x2="300"
                y2="90"
                stroke="rgba(16, 185, 129, 0.5)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </g>

            {/* Transaction Graph Nodes */}
            {/* Node 0: Root Investigation Target (Amber/Cyan) */}
            <g
              className={`transition-all duration-300 delay-75 ${
                phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: '60px 90px' }}
            >
              <circle cx="60" cy="90" r="10" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
              <circle cx="60" cy="90" r="5" fill="#38BDF8" />
              <circle cx="60" cy="90" r="2" fill="#FFFFFF" />
            </g>

            {/* Node 1: Hop 1 - Intermediate A */}
            <g
              className={`transition-all duration-300 delay-150 ${
                phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: '140px 45px' }}
            >
              <circle cx="140" cy="45" r="8" fill="rgba(96, 165, 250, 0.12)" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" />
              <circle cx="140" cy="45" r="4" fill="#60A5FA" />
            </g>

            {/* Node 2: Hop 1 - Intermediate B */}
            <g
              className={`transition-all duration-300 delay-150 ${
                phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: '140px 135px' }}
            >
              <circle cx="140" cy="135" r="8" fill="rgba(96, 165, 250, 0.12)" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" />
              <circle cx="140" cy="135" r="4" fill="#60A5FA" />
            </g>

            {/* Node 3: Hop 2 - Aggregation A */}
            <g
              className={`transition-all duration-300 delay-200 ${
                phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: '225px 60px' }}
            >
              <circle cx="225" cy="60" r="8" fill="rgba(129, 140, 248, 0.12)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" />
              <circle cx="225" cy="60" r="4" fill="#818CF8" />
            </g>

            {/* Node 4: Hop 2 - Aggregation B */}
            <g
              className={`transition-all duration-300 delay-200 ${
                phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: '225px 120px' }}
            >
              <circle cx="225" cy="120" r="8" fill="rgba(129, 140, 248, 0.12)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" />
              <circle cx="225" cy="120" r="4" fill="#818CF8" />
            </g>

            {/* Node 5: Terminal VASP Hot-Wallet (Emerald) */}
            <g
              className={`transition-all duration-300 delay-300 ${
                phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: '300px 90px' }}
            >
              <circle cx="300" cy="90" r="11" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
              <circle cx="300" cy="90" r="5" fill="#10B981" />
              <circle cx="300" cy="90" r="2" fill="#FFFFFF" />
            </g>
          </svg>
        </div>

        {/* Branding & Subtitle (Emerges smoothly at Phase 3: 0.8s - 1.2s) */}
        <div
          className={`absolute flex flex-col items-center justify-center transition-all duration-350 ease-out ${
            phase >= 3 && phase < 4
              ? 'opacity-100 scale-100 translate-y-0'
              : phase >= 4
              ? 'opacity-0 scale-95 -translate-y-1'
              : 'opacity-0 scale-90 translate-y-2 pointer-events-none'
          }`}
        >
          {/* Subtle Shield Icon Badge */}
          <div className="mb-2.5 p-2 bg-blue-950/70 rounded-lg border border-blue-700/60 shadow-lg shadow-blue-950/50 flex items-center justify-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-[0.2em] sm:tracking-[0.25em] uppercase text-slate-100 drop-shadow-sm">
            HYDROTRACE
          </h1>

          {/* Subtitle */}
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-400 max-w-sm sm:max-w-md font-sans leading-relaxed tracking-wide px-2">
            Evidence-Driven Blockchain Intelligence for VASP Attribution
          </p>

          {/* Forensics Session indicator */}
          <div className="mt-3 flex items-center space-x-1.5 text-[9px] font-mono text-cyan-400/90 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-800/50 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEM INITIALIZED</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StartupAnimation;

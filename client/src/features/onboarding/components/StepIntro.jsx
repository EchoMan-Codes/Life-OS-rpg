import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Compass, Zap, LogIn } from 'lucide-react';

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Server-Authoritative RPG',
    desc: 'XP, Mana, HP & 5 core attributes reflecting real-world discipline.',
  },
  {
    icon: Compass,
    title: 'Focus Chamber & Reflections',
    desc: 'Integrated pomodoro sprints and 30-day wellness burnout defense.',
  },
  {
    icon: Zap,
    title: 'Zero Fluff. Total Clarity.',
    desc: 'Dailies, habits, and quests organized for low cognitive load.',
  },
];

/**
 * Step 1: Introduction / Manifesto screen.
 */
export function StepIntro({ onContinue, onJumpToAuth }) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6 sm:space-y-8">
        {/* Editorial Subtitle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-mana animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Personal Operating System
          </span>
        </div>

        {/* Editorial Primary Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-ink leading-[1.1]">
            Your life.
            <br />
            <span className="bg-gradient-to-r from-ink via-ink-muted to-mana bg-clip-text text-transparent">
              One system.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-xl">
            LifeOS synthesizes habits, daily rituals, deep focus sessions, and anti-burnout wellness into a living RPG character. Build your days. Conquer resistance. Evolve continuously.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-2 hover:border-white/15 transition-colors"
              >
                <div className="w-7 h-7 rounded-xl bg-mana/10 border border-mana/20 flex items-center justify-center text-mana">
                  <Icon size={14} />
                </div>
                <h2 className="text-xs font-semibold text-ink">{pillar.title}</h2>
                <p className="text-[11px] text-ink-muted leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={onJumpToAuth}
          className="order-2 sm:order-1 text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-white/5 font-mono"
        >
          <LogIn size={13} />
          <span>Already registered? Sign In</span>
        </button>

        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="order-1 sm:order-2 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-ink text-obsidian font-semibold text-sm hover:bg-ink/90 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.12)] min-h-[46px]"
        >
          <span>Begin Calibration</span>
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

StepIntro.propTypes = {
  onContinue: PropTypes.func.isRequired,
  onJumpToAuth: PropTypes.func.isRequired,
};

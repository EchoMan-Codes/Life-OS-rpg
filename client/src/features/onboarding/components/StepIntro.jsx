import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Compass, Zap, LogIn, Sparkles } from 'lucide-react';
import { JeevanLogo } from '@/components/ui/JeevanLogo';

/**
 * Step 1: Welcome & Manifesto Screen.
 * Inspired by Reference 2: Serene composition, focused content hierarchy,
 * strong welcome statement, short supporting description, and a single dominant CTA.
 */
export function StepIntro({ onContinue, onJumpToAuth }) {
  return (
    <div className="flex flex-col justify-between h-full min-h-[440px] py-2">
      <div className="space-y-6 sm:space-y-8">
        {/* Jeevan Brand Header */}
        <div className="flex items-center justify-between">
          <JeevanLogo variant="lockup" size="sm" showTagline />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-mana animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Personal Operating System
            </span>
          </div>
        </div>

        {/* Dominant Welcome Headline */}
        <div className="space-y-3.5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-ink leading-[1.08] font-display">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-ink via-amber-300 to-attr-perception bg-clip-text text-transparent">
              Jeevan
            </span>
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-xl font-normal">
            A unified digital sanctum fusing deep focus, physical vitality, daily rituals, and anti-burnout wellness into character progression. Build your days. Conquer resistance. Evolve continuously.
          </p>
        </div>

        {/* Minimalist 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            {
              icon: ShieldCheck,
              title: 'RPG Discipline',
              desc: 'XP, Mana, HP & 5 core attributes reflecting real effort.',
            },
            {
              icon: Compass,
              title: 'Focus Chamber',
              desc: 'Deep work sprints and evening wellness reflections.',
            },
            {
              icon: Zap,
              title: 'Zero Cognitive Load',
              desc: 'Dailies, habits, and quests organized with absolute clarity.',
            },
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-2 hover:border-white/15 transition-all"
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

      {/* Action Footer (Reference 2: Single Dominant Action) */}
      <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={onJumpToAuth}
          className="order-2 sm:order-1 text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-white/5 font-mono"
        >
          <LogIn size={13} />
          <span>Already registered? Sign In</span>
        </button>

        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          className="order-1 sm:order-2 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-ink text-obsidian font-bold text-sm hover:bg-white transition-all shadow-[0_4px_24px_rgba(255,255,255,0.15)] min-h-[48px]"
        >
          <span>Build my Jeevan</span>
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

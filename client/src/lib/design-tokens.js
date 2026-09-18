/**
 * Life OS — Canonical Design Tokens (JavaScript Mirror)
 *
 * Single JavaScript source of truth for runtime consumption by Framer Motion,
 * Canvas Confetti, and programmatically styled components.
 * Mirrored 1:1 with CSS tokens declared in client/src/index.css @theme.
 */

export const colors = {
  // Obsidian Ramps
  obsidian: '#07080C',
  obsidian950: '#040508',
  obsidian900: '#0B0D14',
  obsidian800: '#12141D',
  obsidian700: '#1B1E2B',
  obsidian600: '#262A3B',

  // Neutrals
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Glass & Borders
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.16)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.04)',

  // Text
  ink: '#E7E9EE',
  inkMuted: '#9AA0AE',
  inkSubtle: '#646A7A',
  inkDisabled: '#4B5162',

  // Semantic Foundation
  bgPage: '#07080C',
  bgElevated: '#0B0D14',
  surface: '#0B0D14',
  surfaceHover: '#12141D',
  surfaceActive: '#1B1E2B',
  surfaceSunken: '#040508',

  // LifeOS Identity
  accentPrimary: '#A78BFA',
  accentSecondary: '#38BDF8',
  progression: '#A78BFA',
  atmospheric: '#1E1B4B',

  // Gameplay Status
  success: '#34D399',
  danger: '#E11D48',
  warning: '#F59E0B',
  focus: '#38BDF8',
  reward: '#EAB308',
  xp: '#F59E0B',
  hp: '#E11D48',
  mana: '#3B82F6',
  gold: '#EAB308',
  streak: '#F97316',
  quest: '#8B5CF6',

  // 5 RPG Attributes
  attribute: {
    strength: '#DC2626',
    intelligence: '#38BDF8',
    vitality: '#34D399',
    willpower: '#A78BFA',
    perception: '#FBBF24',
  },
};

export const radii = {
  control: 10,
  card: 16,
  cardLg: 20,
  modal: 24,
  panel: 18,
  pill: 999,
  full: 9999,
};

export const shadows = {
  glass: '0 8px 32px 0 rgba(0, 0, 0, 0.36), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
  modal: '0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.12)',
  glow: '0 0 0 1px rgba(255, 255, 255, 0.06), 0 8px 30px rgba(0, 0, 0, 0.35)',
  elevation: {
    none: 'none',
    subtle: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    surface: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    elevated: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    floating: '0 16px 36px -4px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    modal: '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.14)',
  },
};

export const layers = {
  base: 0,
  content: 10,
  sticky: 20,
  floating: 30,
  dropdown: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
  cinematic: 80,
};

export const breakpoints = {
  xs: 375,
  phone: 390,
  phoneLg: 430,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  desktopLg: 1440,
  desktopXl: 1920,
};

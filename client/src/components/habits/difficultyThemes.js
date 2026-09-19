/**
 * Exact Habit Difficulty Color Configurations:
 * - Easy: light cyan / azure blue — calm, clean, lower-intensity frame energy
 * - Medium: vivid violet / purple — stronger portal glow and crystalline accents
 * - Difficult: deep electric cobalt blue — heavier structural rails, brighter blue energy seams, intense readable glow (NEVER RED)
 * - Neutral: celestial cyan/violet obsidian hybrid for modules and command deck
 */
export const DIFFICULTY_THEMES = {
  easy: {
    accent: '#38bdf8', // Light Cyan / Azure
    secondary: '#06b6d4',
    border: 'border-cyan-500/40',
    borderGlow: 'rgba(6, 182, 212, 0.35)',
    railBg: 'bg-cyan-950/30',
    glowShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.18)]',
    energySeam: 'from-transparent via-cyan-300 to-transparent',
    crestColor: '#38bdf8',
    crestFill: 'rgba(6, 182, 212, 0.25)',
    badgeClass: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    pylonColor: 'text-cyan-400/50',
    intensity: 'calm',
  },
  medium: {
    accent: '#c084fc', // Vivid Violet / Purple
    secondary: '#a855f7',
    border: 'border-purple-500/50',
    borderGlow: 'rgba(168, 85, 247, 0.45)',
    railBg: 'bg-purple-950/35',
    glowShadow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    energySeam: 'from-transparent via-purple-300 to-transparent',
    crestColor: '#c084fc',
    crestFill: 'rgba(168, 85, 247, 0.3)',
    badgeClass: 'bg-purple-500/15 border-purple-400/50 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.3)]',
    pylonColor: 'text-purple-400/60',
    intensity: 'vivid',
  },
  difficult: {
    accent: '#60a5fa', // Deep Electric Cobalt Blue (Never Red)
    secondary: '#2563eb',
    border: 'border-blue-500/70',
    borderGlow: 'rgba(37, 99, 235, 0.6)',
    railBg: 'bg-blue-950/45',
    glowShadow: 'shadow-[0_0_30px_rgba(37,99,235,0.35)]',
    energySeam: 'from-transparent via-sky-200 to-transparent',
    crestColor: '#60a5fa',
    crestFill: 'rgba(37, 99, 235, 0.4)',
    badgeClass: 'bg-blue-600/25 border-blue-400/70 text-blue-100 shadow-[0_0_16px_rgba(37,99,235,0.45)]',
    pylonColor: 'text-blue-400/75',
    intensity: 'heavy',
  },
  neutral: {
    accent: '#38bdf8',
    secondary: '#818cf8',
    border: 'border-cyan-500/30',
    borderGlow: 'rgba(56, 189, 248, 0.25)',
    railBg: 'bg-obsidian-900/60',
    glowShadow: 'shadow-[0_0_20px_rgba(15,23,42,0.6)]',
    energySeam: 'from-transparent via-cyan-300 to-transparent',
    crestColor: '#38bdf8',
    crestFill: 'rgba(56, 189, 248, 0.15)',
    badgeClass: 'bg-slate-800/80 border-slate-600/50 text-slate-200',
    pylonColor: 'text-cyan-400/40',
    intensity: 'calm',
  },
};

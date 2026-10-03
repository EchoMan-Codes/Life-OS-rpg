import {
  LayoutDashboard,
  Clock,
  User,
  Layers,
  BookOpen,
  Sparkles,
  Flame,
  CalendarCheck,
  Moon,
  Wallet,
  PlusCircle,
  BarChart3,
  Target,
  Award,
  ShoppingBag,
  Crown,
  Bot,
  Calendar,
  Compass,
} from 'lucide-react';

export const SECTION_NAV_CONFIGS = {
  dashboard: {
    id: 'dashboard',
    title: 'Grand Dashboard',
    badge: 'COMMAND CENTER',
    accentColor: '#3B82F6',
    route: '/',
    mobileItems: [
      { to: '/', icon: LayoutDashboard, label: 'Overview' },
      { to: '/focus', icon: Clock, label: 'Focus' },
      { to: '/profile', icon: User, label: 'Profile' },
    ],
    sidebarItems: [
      { to: '/', icon: LayoutDashboard, label: 'Command Center' },
      { to: '/focus', icon: Clock, label: 'Focus Sprint' },
      { to: '/profile', icon: User, label: 'Hero Profile' },
    ],
  },

  studysmart: {
    id: 'studysmart',
    title: 'StudySmart',
    badge: 'ACADEMIC SANCTUM',
    accentColor: '#6366F1',
    route: '/study',
    mobileItems: [
      { to: '/study', icon: BookOpen, label: 'Subjects' },
      { to: '/focus', icon: Clock, label: 'Focus Chamber' },
      { to: '/ai', icon: Bot, label: 'AI Tutor' },
    ],
    sidebarItems: [
      { to: '/study', icon: BookOpen, label: 'Subject Mastery' },
      { to: '/focus', icon: Clock, label: 'Focus Chamber' },
      { to: '/ai', icon: Bot, label: 'AI Study Planner' },
    ],
  },

  wellness: {
    id: 'wellness',
    title: 'Wellness',
    badge: 'VITALITY ENGINE',
    accentColor: '#10B981',
    route: '/wellness',
    mobileItems: [
      { to: '/wellness', icon: Flame, label: 'Sanctuary' },
      { to: '/habits', icon: Flame, label: 'Habits' },
      { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
      { to: '/reflection', icon: Moon, label: 'Reflect' },
    ],
    sidebarItems: [
      { to: '/wellness', icon: Flame, label: 'Sanctuary Overview' },
      { to: '/habits', icon: Flame, label: 'Atomic Habits' },
      { to: '/dailies', icon: CalendarCheck, label: 'Daily Rituals' },
      { to: '/reflection', icon: Moon, label: 'Evening Reflection' },
    ],
  },

  finance: {
    id: 'finance',
    title: 'Finance',
    badge: 'WEALTH VAULT',
    accentColor: '#F59E0B',
    route: '/finance',
    mobileItems: [
      { to: '/finance', icon: Wallet, label: 'Vault' },
      { to: '/ai', icon: Bot, label: 'AI Audit' },
      { to: '/shop', icon: ShoppingBag, label: 'Rewards' },
    ],
    sidebarItems: [
      { to: '/finance', icon: Wallet, label: 'Vault Overview' },
      { to: '/ai', icon: Bot, label: 'AI Spend Analytics' },
      { to: '/shop', icon: ShoppingBag, label: 'Reward Store' },
    ],
  },

  goals: {
    id: 'goals',
    title: 'Goals & Planning',
    badge: 'DESTINY ROADMAP',
    accentColor: '#EC4899',
    route: '/quests',
    mobileItems: [
      { to: '/quests', icon: Target, label: 'Quests' },
      { to: '/focus', icon: Clock, label: 'Sprint' },
      { to: '/ai', icon: Bot, label: 'AI Plan' },
    ],
    sidebarItems: [
      { to: '/quests', icon: Target, label: 'Active Quests' },
      { to: '/focus', icon: Clock, label: 'Focus Sprint' },
      { to: '/ai', icon: Bot, label: 'AI Milestone Planner' },
    ],
  },

  rewards: {
    id: 'rewards',
    title: 'Rewards Shop',
    badge: 'POWER & LOOT',
    accentColor: '#EAB308',
    route: '/shop',
    mobileItems: [
      { to: '/shop', icon: ShoppingBag, label: 'Store' },
      { to: '/profile', icon: Crown, label: 'Ranks' },
      { to: '/quests', icon: Award, label: 'Quests' },
    ],
    sidebarItems: [
      { to: '/shop', icon: ShoppingBag, label: 'Loot Store' },
      { to: '/profile', icon: Crown, label: 'Hero Attributes' },
      { to: '/quests', icon: Award, label: 'Achievements' },
    ],
  },

  ai: {
    id: 'ai',
    title: 'Jeevan AI',
    badge: 'LIFE INTELLIGENCE',
    accentColor: '#A855F7',
    route: '/ai',
    mobileItems: [
      { to: '/ai', icon: Bot, label: 'Assistant' },
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/study', icon: BookOpen, label: 'Study' },
    ],
    sidebarItems: [
      { to: '/ai', icon: Bot, label: 'Life Coach' },
      { to: '/', icon: LayoutDashboard, label: 'Dashboard Sync' },
      { to: '/study', icon: BookOpen, label: 'StudySmart' },
      { to: '/finance', icon: Wallet, label: 'Finance Vault' },
    ],
  },
};

/**
 * Determines the active section configuration based on the current URL.
 */
export function getActiveSectionConfig(pathname) {
  if (pathname === '/study') return SECTION_NAV_CONFIGS.studysmart;
  if (pathname === '/wellness' || pathname === '/habits' || pathname === '/dailies' || pathname === '/reflection') return SECTION_NAV_CONFIGS.wellness;
  if (pathname === '/finance') return SECTION_NAV_CONFIGS.finance;
  if (pathname === '/quests' || pathname === '/goals') return SECTION_NAV_CONFIGS.goals;
  if (pathname === '/shop' || pathname === '/rewards') return SECTION_NAV_CONFIGS.rewards;
  if (pathname === '/ai') return SECTION_NAV_CONFIGS.ai;
  if (pathname === '/focus') {
    // If user came from study, default to studysmart, otherwise dashboard
    try {
      const selected = localStorage.getItem('lifeos_selected_section');
      if (selected === 'studysmart') return SECTION_NAV_CONFIGS.studysmart;
    } catch {}
    return SECTION_NAV_CONFIGS.dashboard;
  }
  return SECTION_NAV_CONFIGS.dashboard;
}

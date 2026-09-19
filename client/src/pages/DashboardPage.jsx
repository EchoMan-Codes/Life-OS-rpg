import { useState } from 'react';
import clsx from 'clsx';

import { useDashboardMetrics } from '@/features/dashboard/useDashboardMetrics';
import { useDashboardPreferences } from '@/features/dashboard/useDashboardPreferences';
import { RestModeBanner } from '@/components/hud/RestModeBanner';
import { DashboardAtmosphere } from '@/components/dashboard/DashboardAtmosphere';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { MissionSpotlightDeck } from '@/components/dashboard/MissionSpotlightDeck';
import { TodayPrioritiesSection } from '@/components/dashboard/TodayPrioritiesSection';
import { FocusCommandSection } from '@/components/dashboard/FocusCommandSection';
import { GoalsProgressSection } from '@/components/dashboard/GoalsProgressSection';
import { ProductivityAnalyticsSection } from '@/components/dashboard/ProductivityAnalyticsSection';
import { TodayTimelineSection } from '@/components/dashboard/TodayTimelineSection';
import { HabitsFocusSection } from '@/components/dashboard/HabitsFocusSection';
import { LifeOSInsightsSection } from '@/components/dashboard/LifeOSInsightsSection';
import { DashboardCustomizerModal } from '@/components/dashboard/DashboardCustomizerModal';

// Shared modals for frictionless quick actions
import { DailyModal } from '@/components/dailies/DailyModal';
import { QuestModal } from '@/components/quests/QuestModal';
import { HabitModal } from '@/components/habits/HabitModal';

/**
 * Premium LifeOS Productivity Command Center — Phase 4.
 *
 * Implements:
 * - Mature futuristic sci-fi / RPG command center design language
 * - Cosmic atmospheric depth engine with attribute-reactive plasma auras
 * - Cinematic command hero with tabular telemetry and primary directive CTA
 * - 3D angled fanned Mission Spotlight deck (desktop) & native swipe carousel (mobile)
 * - Hierarchical priorities with tactile checkbox and +XP floating reward feedback
 * - Deep Work Chamber execution module with progress ring and quick presets
 * - Preserves 100% of real PostgreSQL metrics and database state
 */
export default function DashboardPage() {
  const metrics = useDashboardMetrics();
  const {
    visibleSections,
    density,
    toggleSection,
    setDensity,
    resetPreferences,
  } = useDashboardPreferences();

  // Modals state
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);

  const isCompact = density === 'compact';

  // Extract top pending priority item to feature in the hero banner
  const primaryPriority = metrics.priorityItems?.[0] || null;

  return (
    <div className={clsx('relative max-w-6xl mx-auto pb-16', isCompact ? 'space-y-5 sm:space-y-6' : 'space-y-6 sm:space-y-8')}>
      {/* 0. Cinematic Cosmic Depth Atmosphere (No Three.js) */}
      <DashboardAtmosphere primaryAttribute={metrics.character?.primaryAttribute || 'willpower'} />

      {/* 1. Rest Mode Warning Banner (if burnout safety valve triggered) */}
      <RestModeBanner />

      {/* 2. Top Command Deck: Stardate, Operator Greeting & Telemetry Strip */}
      <DashboardHero
        user={metrics.user}
        character={metrics.character}
        priorityItems={metrics.priorityItems}
        totalDailiesDueCount={metrics.totalDailiesDueCount}
        completedDailiesCount={metrics.completedDailiesCount}
        totalHabitsCount={metrics.totalHabitsCount}
        completedHabitsCount={metrics.completedHabitsCount}
        todayFocusMinutes={metrics.todayFocusMinutes}
        maxActiveStreak={metrics.maxActiveStreak}
        taskCompletionRate={metrics.taskCompletionRate}
        hasActiveSession={metrics.hasActiveSession}
        isResting={metrics.character?.isResting || false}
        primaryPriority={primaryPriority}
        onOpenCustomizer={() => setCustomizerOpen(true)}
      />

      {/* 3. Mission Spotlight: 3D Fanned Card Deck (Desktop) / Native Carousel (Mobile) */}
      {visibleSections.goals && (
        <MissionSpotlightDeck
          activeQuests={metrics.activeQuests}
          onOpenCreateQuest={() => setQuestModalOpen(true)}
        />
      )}

      {/* 4. Primary Action Surface: Today's Directives + Deep Work Chamber */}
      {/* Desktop: 8-col / 4-col split. Mobile: vertical stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 Cols): Today's Directives (Primary execution surface) */}
        {visibleSections.priorities && (
          <div className={visibleSections.focus ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <TodayPrioritiesSection
              priorityItems={metrics.priorityItems}
              completedDailies={metrics.completedDailies}
              completedQuests={metrics.completedQuestsToday}
              onOpenCreateDaily={() => setDailyModalOpen(true)}
              onOpenCreateQuest={() => setQuestModalOpen(true)}
            />
          </div>
        )}

        {/* Right (4 Cols): Focus Chamber Command */}
        {visibleSections.focus && (
          <div className={visibleSections.priorities ? 'lg:col-span-4' : 'lg:col-span-12'}>
            <FocusCommandSection
              todayFocusMinutes={metrics.todayFocusMinutes}
              completedSessionsCount={metrics.completedFocusSessionsToday.length}
            />
          </div>
        )}
      </div>

      {/* 5. Velocity Analytics & Momentum Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Velocity Analytics (Recharts with gradient fills) */}
        {visibleSections.analytics && (
          <div className={visibleSections.habits ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <ProductivityAnalyticsSection last7Days={metrics.last7Days} />
          </div>
        )}

        {/* Habit Streaks & Momentum Scoring */}
        {visibleSections.habits && (
          <div className={visibleSections.analytics ? 'lg:col-span-5' : 'lg:col-span-12'}>
            <HabitsFocusSection
              topHabits={metrics.topHabits}
              onOpenCreateHabit={() => setHabitModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* 6. Chrono Timeline & Long-Range Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {visibleSections.timeline && (
          <div className={visibleSections.goals ? 'lg:col-span-5' : 'lg:col-span-12'}>
            <TodayTimelineSection timeline={metrics.timeline} />
          </div>
        )}

        {visibleSections.goals && (
          <div className={visibleSections.timeline ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <GoalsProgressSection
              activeQuests={metrics.activeQuests}
              onOpenCreateQuest={() => setQuestModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* 7. Tactical Intelligence Signals (Real-Data Derived) */}
      {visibleSections.insights && (
        <LifeOSInsightsSection insights={metrics.insights} />
      )}

      {/* 8. Modals for frictionless actions & layout customization */}
      <DashboardCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        visibleSections={visibleSections}
        onToggleSection={toggleSection}
        density={density}
        onSetDensity={setDensity}
        onResetPreferences={resetPreferences}
      />

      <DailyModal
        isOpen={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
      />

      <QuestModal
        isOpen={questModalOpen}
        onClose={() => setQuestModalOpen(false)}
      />

      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
      />
    </div>
  );
}

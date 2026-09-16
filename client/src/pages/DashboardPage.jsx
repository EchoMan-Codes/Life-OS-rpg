import { useState } from 'react';
import clsx from 'clsx';
import { useDashboardMetrics } from '@/features/dashboard/useDashboardMetrics';
import { useDashboardPreferences } from '@/features/dashboard/useDashboardPreferences';
import { RestModeBanner } from '@/components/hud/RestModeBanner';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
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
 * Premium LifeOS Productivity Command Center.
 * Answers immediately: "How am I doing today, what matters now, and am I actually making progress?"
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

  return (
    <div className={clsx('max-w-6xl mx-auto pb-16', isCompact ? 'space-y-6' : 'space-y-8')}>
      {/* 1. Rest Mode Warning Banner (if burnout safety valve triggered) */}
      <RestModeBanner />

      {/* 2. Top Section: Personalized Greeting & Today at a Glance Summary */}
      <DashboardGreeting
        user={metrics.user}
        totalDailiesDueCount={metrics.totalDailiesDueCount}
        completedDailiesCount={metrics.completedDailiesCount}
        todayFocusMinutes={metrics.todayFocusMinutes}
        maxActiveStreak={metrics.maxActiveStreak}
        taskCompletionRate={metrics.taskCompletionRate}
        hasActiveSession={metrics.hasActiveSession}
        isResting={metrics.character?.isResting || false}
        onOpenCustomizer={() => setCustomizerOpen(true)}
      />

      {/* 3. Primary Action Surface: Today's Priorities + Focus Command */}
      {/* Desktop: 8-col / 4-col split. Mobile: vertical stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 Cols): Today's Priorities (Primary action surface) */}
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

        {/* Right (4 Cols): Focus Execution Command */}
        {visibleSections.focus && (
          <div className={visibleSections.priorities ? 'lg:col-span-4' : 'lg:col-span-12'}>
            <FocusCommandSection
              todayFocusMinutes={metrics.todayFocusMinutes}
              completedSessionsCount={metrics.completedFocusSessionsToday.length}
            />
          </div>
        )}
      </div>

      {/* 4. Secondary Action & Context Sections (Below primary viewport) */}

      {/* Goals & Progress (Multi-step Quests) */}
      {visibleSections.goals && (
        <GoalsProgressSection
          activeQuests={metrics.activeQuests}
          onOpenCreateQuest={() => setQuestModalOpen(true)}
        />
      )}

      {/* Productivity & Activity Analytics (Recharts) */}
      {visibleSections.analytics && (
        <ProductivityAnalyticsSection last7Days={metrics.last7Days} />
      )}

      {/* Two-column layout: Today's Timeline + Habits & Momentum */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {visibleSections.timeline && (
          <div className={visibleSections.habits ? 'lg:col-span-6' : 'lg:col-span-12'}>
            <TodayTimelineSection timeline={metrics.timeline} />
          </div>
        )}

        {visibleSections.habits && (
          <div className={visibleSections.timeline ? 'lg:col-span-6' : 'lg:col-span-12'}>
            <HabitsFocusSection
              topHabits={metrics.topHabits}
              onOpenCreateHabit={() => setHabitModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Intelligent LifeOS Real Insights */}
      {visibleSections.insights && (
        <LifeOSInsightsSection insights={metrics.insights} />
      )}

      {/* 5. Modals for frictionless actions & layout customization */}
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

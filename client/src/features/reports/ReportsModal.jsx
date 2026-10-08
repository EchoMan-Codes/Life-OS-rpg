import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Scroll,
  Coins,
  Sparkles,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

import { apiClient } from '@/lib/axios';
import { playSound } from '@/lib/sound';

export function ReportsModal({ isOpen, onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchReportData = async () => {
    const res = await apiClient.get('/reports/data');
    return res.data.data;
  };

  // Export to CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = await fetchReportData();
      const rows = [
        ['Type', 'Title / Identifier', 'Detail 1', 'Detail 2', 'Status / Metric', 'Date / Time'],
        ['User', data.user.displayName, data.user.email, `Level ${data.character.level}`, `${data.character.xp} XP`, data.user.memberSince || ''],
        ['Summary', 'Focus Hours', `${data.summary.totalFocusHours} hrs`, 'Quests Done', `${data.summary.completedQuestsCount}/${data.summary.totalQuestsCount}`, ''],
        ['Summary', 'Habit Streak', `${data.summary.bestHabitStreak} days peak`, 'Active Dailies', `${data.summary.totalDailiesCount}`, ''],
        ...data.dailies.map((d) => ['Daily', d.title, d.scheduledTime, `${d.durationMinutes} min`, d.isCompleteToday ? 'Completed' : 'Pending', `Streak: ${d.streakCurrent}d`]),
        ...data.habits.map((h) => ['Habit', h.title, h.difficulty, h.direction, `Streak: ${h.currentStreak}d (Best: ${h.bestStreak}d)`, '']),
        ...data.quests.map((q) => ['Quest', q.title, q.priority, q.difficulty, `${q.progressPercent}% (${q.status})`, q.dueDate]),
        ...data.focusSessions.map((f) => ['Focus', f.title, `${f.durationMinutes} min`, f.status, '', f.date]),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `jeevan_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      playSound('loot_drop');
      setSuccessMessage('CSV report exported successfully!');
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to XLSX
  const handleExportXLSX = async () => {
    setIsExporting(true);
    try {
      const data = await fetchReportData();
      const wb = XLSX.utils.book_new();

      // Sheet 1: Overview
      const overviewData = [
        { Metric: 'User Name', Value: data.user.displayName },
        { Metric: 'Email', Value: data.user.email },
        { Metric: 'Character Level', Value: data.character.level },
        { Metric: 'Total XP', Value: data.character.xp },
        { Metric: 'Coins', Value: data.character.gold },
        { Metric: 'Total Focus Hours', Value: data.summary.totalFocusHours },
        { Metric: 'Best Habit Streak', Value: `${data.summary.bestHabitStreak} days` },
        { Metric: 'Completed Quests', Value: `${data.summary.completedQuestsCount} of ${data.summary.totalQuestsCount}` },
        { Metric: 'Generated At', Value: data.generatedAt },
      ];
      const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

      // Sheet 2: Dailies
      if (data.dailies.length > 0) {
        const dailiesSheet = XLSX.utils.json_to_sheet(
          data.dailies.map((d) => ({
            Title: d.title,
            ScheduledTime: d.scheduledTime,
            DurationMinutes: d.durationMinutes,
            Priority: d.priority,
            Difficulty: d.difficulty,
            CompletedToday: d.isCompleteToday ? 'YES' : 'NO',
            CurrentStreak: d.streakCurrent,
            BestStreak: d.streakBest,
          }))
        );
        XLSX.utils.book_append_sheet(wb, dailiesSheet, 'Dailies');
      }

      // Sheet 3: Habits
      if (data.habits.length > 0) {
        const habitsSheet = XLSX.utils.json_to_sheet(
          data.habits.map((h) => ({
            Title: h.title,
            Difficulty: h.difficulty,
            Direction: h.direction,
            CurrentStreak: h.currentStreak,
            BestStreak: h.bestStreak,
          }))
        );
        XLSX.utils.book_append_sheet(wb, habitsSheet, 'Habits');
      }

      // Sheet 4: Quests
      if (data.quests.length > 0) {
        const questsSheet = XLSX.utils.json_to_sheet(
          data.quests.map((q) => ({
            Title: q.title,
            Priority: q.priority,
            Difficulty: q.difficulty,
            Status: q.status,
            DueDate: q.dueDate,
            ProgressPercent: `${q.progressPercent}%`,
            SubtasksDone: `${q.subtasksCompleted}/${q.subtasksTotal}`,
          }))
        );
        XLSX.utils.book_append_sheet(wb, questsSheet, 'Quests');
      }

      // Sheet 5: Focus
      if (data.focusSessions.length > 0) {
        const focusSheet = XLSX.utils.json_to_sheet(
          data.focusSessions.map((s) => ({
            Title: s.title,
            DurationMinutes: s.durationMinutes,
            Status: s.status,
            Date: s.date,
          }))
        );
        XLSX.utils.book_append_sheet(wb, focusSheet, 'Focus');
      }

      XLSX.writeFile(wb, `jeevan_operating_report_${Date.now()}.xlsx`);
      playSound('loot_drop');
      setSuccessMessage('XLSX spreadsheet generated and downloaded!');
    } catch (err) {
      console.error('Failed to export XLSX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const data = await fetchReportData();
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Title & Header Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text('JEEVAN — LIFE OS REPORT', 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${new Date().toLocaleDateString()} for ${data.user.displayName}`, 14, 26);
      doc.text(`Level ${data.character.level} • XP: ${data.character.xp} • Coins: ${data.character.gold}`, 14, 31);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, 196, 35);

      // Section: Summary Statistics
      let y = 43;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Operational Telemetry Summary', 14, y);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`• Total Deep Focus Time: ${data.summary.totalFocusHours} Hours`, 18, y);
      y += 6;
      doc.text(`• Peak Habit Streak: ${data.summary.bestHabitStreak} Consecutive Days`, 18, y);
      y += 6;
      doc.text(`• Active Disciplines: ${data.summary.activeHabitsCount} Habits Tracked`, 18, y);
      y += 6;
      doc.text(`• Quests Completed: ${data.summary.completedQuestsCount} of ${data.summary.totalQuestsCount} Campaigns`, 18, y);

      // Section: Dailies
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('2. Daily Rituals & Schedule', 14, y);

      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      data.dailies.slice(0, 8).forEach((d) => {
        const status = d.isCompleteToday ? '[DONE]' : '[PENDING]';
        doc.text(`${status} ${d.title} (${d.scheduledTime || 'Flex'}, ${d.durationMinutes}m) — Streak: ${d.streakCurrent}d`, 18, y);
        y += 5.5;
      });

      // Section: Habits
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('3. Active Habits Momentum', 14, y);

      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      data.habits.slice(0, 8).forEach((h) => {
        doc.text(`• ${h.title} [${h.difficulty}] — Current Streak: ${h.currentStreak}d (Best: ${h.bestStreak}d)`, 18, y);
        y += 5.5;
      });

      // Section: Quests
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('4. Strategic Quests & Projects', 14, y);

      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      data.quests.slice(0, 6).forEach((q) => {
        doc.text(`• ${q.title} — ${q.progressPercent}% complete (${q.priority} priority, Due: ${q.dueDate})`, 18, y);
        y += 5.5;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Jeevan Personal Operating System • Authentic User Telemetry', 14, 285);

      doc.save(`jeevan_report_${Date.now()}.pdf`);
      playSound('loot_drop');
      setSuccessMessage('PDF report generated and downloaded!');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md flex flex-col rounded-3xl bg-white/85 dark:bg-[#0B0D14]/75 backdrop-blur-3xl border border-white/70 dark:border-white/18 shadow-[0_20px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden z-10 p-5 sm:p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display">
                    Reports & Data Export
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    Generate authentic productivity audits
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Export Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* PDF Option */}
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-ink group-hover:text-rose-500 transition-colors">
                      Executive Summary PDF
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                      Formatted printable report with progress analytics
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
              </button>

              {/* XLSX Option */}
              <button
                type="button"
                onClick={handleExportXLSX}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-ink group-hover:text-emerald-500 transition-colors">
                      Structured Spreadsheet (XLSX)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                      Multi-sheet workbook (Dailies, Habits, Quests, Focus)
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </button>

              {/* CSV Option */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <Download size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-ink group-hover:text-amber-500 transition-colors">
                      Raw Dataset (CSV)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                      Clean tabular records for external data tools
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              </button>
            </div>

            {isExporting && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-amber-600 dark:text-gold font-bold">
                <Loader2 size={14} className="animate-spin" />
                <span>Compiling real telemetry data...</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

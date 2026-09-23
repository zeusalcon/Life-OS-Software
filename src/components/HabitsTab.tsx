import React, { useState } from 'react';
import { HabitEntry } from '../types';
import { 
  CheckCircle, 
  Calendar, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Sparkles, 
  Moon, 
  Droplets, 
  Brain, 
  Utensils, 
  Monitor, 
  TrendingUp, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { motion } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface HabitsTabProps {
  habits: HabitEntry[];
  onAddHabit: (entry: Omit<HabitEntry, 'rowIndex'>) => Promise<void>;
  onUpdateHabit: (entry: HabitEntry) => Promise<void>;
  onDeleteHabit: (rowIndex: number) => Promise<void>;
}

export default function HabitsTab({
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit
}: HabitsTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitEntry | null>(null);

  // Form State
  const [date, setDate] = useState<string>(getMountainDateString());
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [waterLiters, setWaterLiters] = useState<number>(2.0);
  const [meditation, setMeditation] = useState<boolean>(false);
  const [mindfulEating, setMindfulEating] = useState<boolean>(false);
  const [screenTimeMins, setScreenTimeMins] = useState<number>(120);

  const [isSaving, setIsSaving] = useState(false);

  // Sort habits descending
  const sortedHabits = [...habits].sort((a, b) => b.date.localeCompare(a.date));

  // Compute Averages & Completion rates
  const totalLogs = habits.length;
  const avgSleep = totalLogs > 0
    ? (habits.reduce((sum, h) => sum + h.sleepHours, 0) / totalLogs).toFixed(1)
    : 'N/A';
  const avgWater = totalLogs > 0
    ? (habits.reduce((sum, h) => sum + h.waterLiters, 0) / totalLogs).toFixed(1)
    : 'N/A';
  const meditationPercent = totalLogs > 0
    ? Math.round((habits.filter(h => h.meditation).length / totalLogs) * 100)
    : 0;
  const mindfulEatingPercent = totalLogs > 0
    ? Math.round((habits.filter(h => h.mindfulEating).length / totalLogs) * 100)
    : 0;
  const avgScreenTime = totalLogs > 0
    ? Math.round(habits.reduce((sum, h) => sum + h.screenTimeMins, 0) / totalLogs)
    : 'N/A';

  const handleEditClick = (entry: HabitEntry) => {
    setEditingHabit(entry);
    setDate(entry.date);
    setSleepHours(entry.sleepHours);
    setWaterLiters(entry.waterLiters);
    setMeditation(entry.meditation);
    setMindfulEating(entry.mindfulEating);
    setScreenTimeMins(entry.screenTimeMins);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingHabit(null);
    setDate(getMountainDateString());
    setSleepHours(7.5);
    setWaterLiters(2.0);
    setMeditation(false);
    setMindfulEating(false);
    setScreenTimeMins(120);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSaving(true);
    try {
      if (editingHabit && editingHabit.rowIndex) {
        const confirmed = window.confirm(
          `Are you sure you want to update your habits checklist for ${date}?`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }

        await onUpdateHabit({
          ...editingHabit,
          date,
          sleepHours: Number(sleepHours) || 0,
          waterLiters: Number(waterLiters) || 0,
          meditation,
          mindfulEating,
          screenTimeMins: Number(screenTimeMins) || 0
        });
      } else {
        // Check if an entry for this date already exists
        const exists = habits.some(h => h.date === date);
        if (exists) {
          alert(`A habits checklist entry for ${date} already exists. Please edit the existing entry instead.`);
          setIsSaving(false);
          return;
        }

        await onAddHabit({
          date,
          sleepHours: Number(sleepHours) || 0,
          waterLiters: Number(waterLiters) || 0,
          meditation,
          mindfulEating,
          screenTimeMins: Number(screenTimeMins) || 0
        });
      }
      handleCancel();
    } catch (err) {
      console.error(err);
      alert('Failed to save habits checklist. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (entry: HabitEntry) => {
    if (!entry.rowIndex) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete your habits entry for ${entry.date}?`
    );
    if (!confirmed) return;

    try {
      await onDeleteHabit(entry.rowIndex);
    } catch (err) {
      console.error(err);
      alert('Failed to delete habits entry.');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title & Top Banner */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-brand-light-sand pb-6">
        <div>
          <p className="sans text-[10px] opacity-60 uppercase tracking-widest mb-1 font-bold">
            Habits & Wellness
          </p>
          <h2 className="serif text-3xl font-bold text-brand-sage tracking-tight">
            Wellness Checklist
          </h2>
          <p className="text-xs text-brand-text/70 mt-1 max-w-xl">
            Track sleep metrics, hydration levels, screen limits, and daily routines to maintain an optimal balance.
          </p>
        </div>
        <button
          onClick={() => {
            if (isFormOpen) {
              handleCancel();
            } else {
              setIsFormOpen(true);
            }
          }}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md shadow-brand-sage/10 transition self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Log Today's Habits
        </button>
      </header>

      {/* Habits Aggregated Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Avg Sleep</span>
            <div className="p-2 bg-brand-cream rounded-lg text-brand-sage">
              <Moon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-display serif text-brand-sage">{avgSleep} hrs</span>
            <span className="text-[10px] text-brand-text/50 block font-medium">Optimal: 7-9 hrs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Avg Water</span>
            <div className="p-2 bg-brand-cream rounded-lg text-brand-sage">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-display serif text-brand-sage">{avgWater} L</span>
            <span className="text-[10px] text-brand-text/50 block font-medium">Target: 2.0+ L</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Meditation</span>
            <div className="p-2 bg-brand-cream rounded-lg text-brand-sage">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-display serif text-brand-sage">{meditationPercent}%</span>
            <span className="text-[10px] text-brand-text/50 block font-medium">Completion rate</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Mindful Eating</span>
            <div className="p-2 bg-brand-cream rounded-lg text-brand-sage">
              <Utensils className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-display serif text-brand-sage">{mindfulEatingPercent}%</span>
            <span className="text-[10px] text-brand-text/50 block font-medium">Completion rate</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow col-span-2 md:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Avg Screen</span>
            <div className="p-2 bg-brand-cream rounded-lg text-brand-sage">
              <Monitor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-display serif text-brand-sage">{avgScreenTime} m</span>
            <span className="text-[10px] text-brand-text/50 block font-medium">Daily screen time</span>
          </div>
        </div>
      </div>

      {/* Expandable Logging Form */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[24px] border border-brand-border soft-shadow max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-4 mb-5">
            <h3 className="text-sm font-bold text-brand-sage flex items-center gap-2 serif">
              <Sparkles className="h-4 w-4 text-brand-olive" />
              {editingHabit ? `Edit Habits Checklist for ${date}` : 'Log New Daily Habits'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-xs font-bold text-brand-text/50 hover:text-brand-text"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-brand-text opacity-60">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={!!editingHabit}
                    className="w-full input-field disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Sleep Hours */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-brand-text opacity-60">Sleep (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  required
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full input-field"
                  placeholder="e.g. 7.5"
                />
              </div>

              {/* Water Liters */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-brand-text opacity-60">Water (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  required
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(Number(e.target.value))}
                  className="w-full input-field"
                  placeholder="e.g. 2.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Screen Time Mins */}
              <div className="flex flex-col gap-1.5 justify-center">
                <label className="text-[10px] uppercase tracking-wider text-brand-text opacity-60">Screen Time (Mins)</label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  required
                  value={screenTimeMins}
                  onChange={(e) => setScreenTimeMins(Number(e.target.value))}
                  className="w-full input-field"
                  placeholder="e.g. 120"
                />
              </div>

              {/* Checkbox toggles */}
              <div className="flex flex-col gap-3 justify-end pb-1 pl-1">
                <div 
                  onClick={() => setMeditation(!meditation)}
                  className="flex items-center gap-2.5 cursor-pointer select-none text-brand-text"
                >
                  {meditation ? (
                    <CheckSquare className="h-5 w-5 text-brand-sage fill-brand-cream/30" />
                  ) : (
                    <Square className="h-5 w-5 text-brand-gray-border" />
                  )}
                  <span className="text-[11px] font-bold">Meditation Completed</span>
                </div>

                <div 
                  onClick={() => setMindfulEating(!mindfulEating)}
                  className="flex items-center gap-2.5 cursor-pointer select-none text-brand-text"
                >
                  {mindfulEating ? (
                    <CheckSquare className="h-5 w-5 text-brand-sage fill-brand-cream/30" />
                  ) : (
                    <Square className="h-5 w-5 text-brand-gray-border" />
                  )}
                  <span className="text-[11px] font-bold">Mindful Eating Completed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-brand-light-sand flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-brand-cream hover:bg-brand-sand rounded-xl text-brand-sage font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-sage hover:bg-brand-dark text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : editingHabit ? 'Update Entry' : 'Save Habits Entry'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Habits Timeline Logs Grid */}
      <div className="bg-white rounded-[32px] border border-brand-border p-6 soft-shadow">
        <h3 className="text-base font-bold serif text-brand-sage flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-brand-olive" />
          Habits History & Checklists
        </h3>
        <p className="text-[11px] text-brand-text opacity-70 mb-5 font-medium">
          A full log of all logged metrics and daily checklist compliance, ordered chronologically.
        </p>

        {sortedHabits.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-gray-border rounded-2xl">
            <CheckCircle className="mx-auto h-12 w-12 text-brand-olive opacity-40 mb-3" />
            <h4 className="text-sm font-semibold text-brand-sage">No habits logged yet</h4>
            <p className="text-xs text-brand-text opacity-50 mt-1 max-w-xs mx-auto">
              Create your very first checklist log to start tracking your health habits inside Google Sheets!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-brand-text/80 border-collapse">
              <thead>
                <tr className="border-b border-brand-light-sand text-[10px] font-bold uppercase tracking-wider text-brand-text opacity-50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sleep</th>
                  <th className="py-3 px-4">Water</th>
                  <th className="py-3 px-4 text-center">Meditation</th>
                  <th className="py-3 px-4 text-center">Mindful Eating</th>
                  <th className="py-3 px-4">Screen Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {sortedHabits.map((habit) => (
                  <tr key={habit.date} className="hover:bg-brand-cream/10 transition">
                    <td className="py-4 px-4 font-bold flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-brand-olive shrink-0" />
                      <span>{habit.date}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-brand-sage">
                        <Moon className="h-3.5 w-3.5 text-brand-olive opacity-60" />
                        <span>{habit.sleepHours} hrs</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-brand-sage">
                        <Droplets className="h-3.5 w-3.5 text-brand-olive opacity-60" />
                        <span>{habit.waterLiters} L</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        habit.meditation 
                          ? 'bg-brand-cream text-brand-sage border border-brand-border' 
                          : 'bg-brand-sand/30 text-brand-text/40'
                      }`}>
                        {habit.meditation ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        habit.mindfulEating 
                          ? 'bg-brand-cream text-brand-sage border border-brand-border' 
                          : 'bg-brand-sand/30 text-brand-text/40'
                      }`}>
                        {habit.mindfulEating ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-brand-sage">
                        <Monitor className="h-3.5 w-3.5 text-brand-olive opacity-60" />
                        <span>{habit.screenTimeMins} mins</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(habit)}
                          className="p-1.5 hover:bg-brand-cream text-brand-sage hover:text-brand-dark rounded-lg transition cursor-pointer"
                          title="Edit checklist"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(habit)}
                          className="p-1.5 hover:bg-red-50 text-brand-sage hover:text-red-600 rounded-lg transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

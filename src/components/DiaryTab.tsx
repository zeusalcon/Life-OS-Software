import React, { useState } from 'react';
import { DiaryEntry } from '../types';
import { Smile, Heart, Calendar, Plus, Save, Trash2, Edit2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface DiaryTabProps {
  entries: DiaryEntry[];
  onAddEntry: (entry: Omit<DiaryEntry, 'rowIndex'>) => Promise<void>;
  onUpdateEntry: (entry: DiaryEntry) => Promise<void>;
  onDeleteEntry: (rowIndex: number) => Promise<void>;
  prefilledDate?: string | null;
  clearPrefilledDate?: () => void;
}

export default function DiaryTab({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  prefilledDate,
  clearPrefilledDate
}: DiaryTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(prefilledDate ? true : false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  
  // Form State
  const [date, setDate] = useState<string>(prefilledDate || getMountainDateString());
  const [mood, setMood] = useState<number>(3);
  const [summary, setSummary] = useState<string>('');
  const [gratitude, setGratitude] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);

  // If a prefilled date is provided, update the form state and open it
  if (prefilledDate && date !== prefilledDate) {
    setDate(prefilledDate);
    setIsFormOpen(true);
    if (clearPrefilledDate) clearPrefilledDate();
  }

  const handleEditClick = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setMood(entry.mood);
    setSummary(entry.summary);
    setGratitude(entry.gratitude);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setDate(getMountainDateString());
    setMood(3);
    setSummary('');
    setGratitude('');
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSaving(true);
    try {
      if (editingEntry && editingEntry.rowIndex) {
        // Confirm update
        const confirmed = window.confirm(
          `Are you sure you want to update your journal entry for ${date}? This will overwrite your existing entry.`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }

        await onUpdateEntry({
          ...editingEntry,
          date,
          mood,
          summary,
          gratitude,
        });
      } else {
        // Check if an entry for this date already exists
        const exists = entries.some(e => e.date === date);
        if (exists) {
          alert(`A journal entry for ${date} already exists. Please edit the existing entry instead.`);
          setIsSaving(false);
          return;
        }

        await onAddEntry({
          date,
          mood,
          summary,
          gratitude,
          workoutLinked: '',
          mediaLinked: '',
          bookLinked: '',
        });
      }
      handleCancel();
    } catch (err) {
      console.error(err);
      alert('Failed to save journal entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (entry: DiaryEntry) => {
    if (!entry.rowIndex) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete your journal entry for ${entry.date}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await onDeleteEntry(entry.rowIndex);
    } catch (err) {
      console.error(err);
      alert('Failed to delete journal entry.');
    }
  };

  function getMoodEmoji(mood: number) {
    switch (mood) {
      case 5: return '✦ Excellent';
      case 4: return '✦ Good';
      case 3: return '✦ Neutral';
      case 2: return '✦ Meh';
      case 1: return '✦ Rough';
      default: return '✦';
    }
  }

  function getMoodLabel(mood: number) {
    switch (mood) {
      case 5: return 'Incredible Day! Feeling energetic, happy, and fully productive.';
      case 4: return 'Good Day. Feeling positive, accomplished, and calm.';
      case 3: return 'Neutral Day. Normal routines, standard productivity, steady energy.';
      case 2: return 'Low-energy Day. Feeling slightly sluggish, tired, or unfocused.';
      case 1: return 'Rough Day. High stress, bad mood, or low energy.';
      default: return '';
    }
  }

  function getMoodGradient(mood: number) {
    switch (mood) {
      case 5: return 'bg-brand-sage text-white';
      case 4: return 'bg-brand-olive text-white';
      case 3: return 'bg-brand-cream text-brand-sage border border-brand-gray-border/40';
      case 2: return 'bg-[#edebe1] text-brand-sage border border-brand-gray-border/30';
      case 1: return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-brand-cream text-brand-sage';
    }
  }

  // Sort entries by date descending
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-brand-light-sand pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brand-sage flex items-center gap-2 serif">
            Journal & Diary
          </h1>
          <p className="text-xs text-brand-text opacity-70 mt-1 font-medium">
            Capture your daily summaries, reflections, gratitude, and rate your mood.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md shadow-brand-sage/10 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Log Entry
          </button>
        )}
      </div>

      {/* Entry Logger Form */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-brand-border soft-shadow space-y-4"
        >
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-3">
            <h2 className="text-sm font-bold text-brand-sage flex items-center gap-1.5 serif">
              <Sparkles className="h-4 w-4 text-brand-olive" />
              {editingEntry ? 'Edit Daily Reflection' : 'Create New Reflection'}
            </h2>
            <button 
              onClick={handleCancel}
              className="text-xs text-brand-text opacity-50 hover:opacity-100 cursor-pointer font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Entry Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-brand-olive" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Mood Selector ({mood}/5)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="w-full accent-brand-sage"
                  />
                  <span className="text-xs px-2.5 py-1 bg-brand-cream text-brand-sage font-bold rounded-lg border border-brand-border/40 whitespace-nowrap">
                    {getMoodEmoji(mood)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-brand-text opacity-60 font-medium italic">
              {getMoodLabel(mood)}
            </p>

            <div>
              <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                Daily Summary (What happened today?)
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a brief overview of your day, highlights, activities, thoughts..."
                rows={3}
                className="w-full px-3 py-2.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive leading-relaxed font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                Gratitude Reflection (1 thing you are grateful for)
              </label>
              <input
                type="text"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="Good coffee, fast internet, catching up with a friend..."
                className="w-full px-3 py-2.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive italic"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-light-sand">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold border border-brand-gray-border text-brand-text opacity-70 rounded-xl hover:bg-brand-bg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md shadow-brand-sage/10 transition cursor-pointer disabled:opacity-55"
              >
                {isSaving ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSaving ? 'Saving to Sheets...' : editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Journal entries feed */}
      <div className="space-y-4">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-16 bg-white border border-brand-border rounded-[32px] soft-shadow">
            <Smile className="mx-auto h-12 w-12 text-brand-olive opacity-40 mb-3" />
            <h3 className="text-sm font-semibold text-brand-sage">No journal logs found</h3>
            <p className="text-xs text-brand-text opacity-60 mt-1 max-w-sm mx-auto font-medium">
              Click the "Log Entry" button to start your journaling habit. Your data is privately stored in your sheet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedEntries.map((entry) => (
              <motion.div
                key={entry.date}
                className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition group"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-light-sand pb-2">
                    <span className="text-[10px] font-mono font-bold text-brand-text opacity-50 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-brand-olive" /> {entry.date}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(entry)}
                        className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-brand-sage rounded hover:bg-brand-bg cursor-pointer"
                        title="Edit Entry"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(entry)}
                        className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-red-600 rounded hover:bg-brand-bg cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${getMoodGradient(entry.mood)}`}>
                      {getMoodEmoji(entry.mood)}
                    </div>
                  </div>

                  {entry.summary && (
                    <p className="text-xs text-brand-text opacity-90 leading-relaxed font-sans font-medium">
                      {entry.summary}
                    </p>
                  )}

                  {entry.gratitude && (
                    <div className="flex items-start gap-1.5 p-3 bg-brand-cream/30 rounded-xl border border-brand-border/40">
                      <Heart className="h-3.5 w-3.5 text-brand-sage mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-brand-text opacity-80 font-bold italic">
                        {entry.gratitude}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

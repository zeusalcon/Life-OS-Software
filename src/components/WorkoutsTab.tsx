import React, { useState } from 'react';
import { WorkoutEntry } from '../types';
import { Dumbbell, Calendar, Clock, Plus, Save, Trash2, Edit2, Sparkles, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import RoutineTracker from './RoutineTracker';
import { getMountainDateString } from '../lib/dateUtils';

interface WorkoutsTabProps {
  workouts: WorkoutEntry[];
  onAddWorkout: (entry: Omit<WorkoutEntry, 'rowIndex'>) => Promise<void>;
  onUpdateWorkout: (entry: WorkoutEntry) => Promise<void>;
  onDeleteWorkout: (rowIndex: number) => Promise<void>;
}

export default function WorkoutsTab({
  workouts,
  onAddWorkout,
  onUpdateWorkout,
  onDeleteWorkout
}: WorkoutsTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutEntry | null>(null);

  // Form State
  const [date, setDate] = useState<string>(getMountainDateString());
  const [type, setType] = useState<string>('Weights');
  const [day, setDay] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [notes, setNotes] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (workout: WorkoutEntry) => {
    setEditingWorkout(workout);
    setDate(workout.date);
    setType(workout.type);
    setDay(workout.day || '');
    setDurationMinutes(workout.durationMinutes);
    setIntensity(workout.intensity);
    setNotes(workout.notes);
    setIsFormOpen(true);
    // Smooth scroll to the form if on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingWorkout(null);
    setDate(getMountainDateString());
    setType('Weights');
    setDay('');
    setDurationMinutes(45);
    setIntensity('Medium');
    setNotes('');
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || durationMinutes <= 0) return;

    setIsSaving(true);
    try {
      if (editingWorkout && editingWorkout.rowIndex) {
        // Confirm update
        const confirmed = window.confirm(
          `Are you sure you want to update this ${type} workout entry for ${date}?`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }

        await onUpdateWorkout({
          ...editingWorkout,
          date,
          type,
          day,
          durationMinutes,
          intensity,
          notes,
        });
      } else {
        const id = 'workout_' + Math.random().toString(36).substr(2, 9);
        await onAddWorkout({
          id,
          date,
          type,
          day,
          durationMinutes,
          intensity,
          notes,
        });
      }
      handleCancel();
    } catch (err) {
      console.error(err);
      alert('Failed to save workout log.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (workout: WorkoutEntry) => {
    if (!workout.rowIndex) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete your ${workout.type} workout on ${workout.date}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await onDeleteWorkout(workout.rowIndex);
    } catch (err) {
      console.error(err);
      alert('Failed to delete workout entry.');
    }
  };

  // Sort workouts by date descending
  const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));

  const intensityColorMap = {
    Low: 'bg-brand-cream text-brand-sage border border-brand-border',
    Medium: 'bg-brand-sand/50 text-brand-sage border border-brand-border',
    High: 'bg-brand-sage text-white'
  };

  const workoutTypes = [
    'Weights', 'Cardio', 'Yoga', 'Pilates', 'Cycling', 'Run/Walk', 'Swimming', 'Sports', 'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-brand-light-sand pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brand-sage flex items-center gap-2 serif">
            Fitness Tracker
          </h1>
          <p className="text-xs text-brand-text opacity-70 mt-1 font-medium">
            Log your training routines, track session durations, and analyze your workout intensity.
          </p>
        </div>
      </div>

      {/* Combined Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Pane: Interactive 3-Day Home Routine Tracker (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-light-sand">
            <div>
              <h2 className="text-base font-bold text-brand-sage flex items-center gap-2 serif">
                <Flame className="h-5 w-5 text-brand-olive" />
                Interactive 3-Day Home Routine
              </h2>
              <p className="text-[10px] text-brand-text opacity-70 mt-0.5 font-medium">
                Execute routines, check off completed sets, use rest timers, and save progress directly to Sheets.
              </p>
            </div>
          </div>
          
          <RoutineTracker workouts={workouts} onAddWorkout={onAddWorkout} />
        </div>

        {/* Right Pane: History & Quick Log (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-light-sand">
            <div>
              <h2 className="text-base font-bold text-brand-sage flex items-center gap-2 serif">
                <Calendar className="h-5 w-5 text-brand-olive" />
                History & Quick Log
              </h2>
              <p className="text-[10px] text-brand-text opacity-70 mt-0.5 font-medium">
                Review logged sessions or manually write custom workout entries.
              </p>
            </div>
            {!isFormOpen && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Quick Log
              </button>
            )}
          </div>

          {/* Workout Logger Form */}
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-3xl border border-brand-border soft-shadow space-y-4"
            >
              <div className="flex items-center justify-between border-b border-brand-light-sand pb-2">
                <h3 className="text-xs font-bold text-brand-sage flex items-center gap-1.5 serif">
                  <Sparkles className="h-3.5 w-3.5 text-brand-olive" />
                  {editingWorkout ? 'Edit Workout Session' : 'Log Workout Session'}
                </h3>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="text-[10px] text-brand-text opacity-50 hover:opacity-100 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1">
                      Workout Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-brand-olive" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1">
                      Workout Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold cursor-pointer"
                    >
                      {workoutTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1">
                      Workout Day / Routine
                    </label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold cursor-pointer"
                    >
                      <option value="">None / Custom</option>
                      <option value="Day A">Day A (Full Body A)</option>
                      <option value="Day B">Day B (Full Body B)</option>
                      <option value="Day C">Day C (Full Body C)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1">
                      Duration (Minutes)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2 h-3.5 w-3.5 text-brand-olive" />
                      <input
                        type="number"
                        required
                        min="1"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1">
                    Intensity Level
                  </label>
                  <div className="flex gap-1.5">
                    {(['Low', 'Medium', 'High'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setIntensity(level)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                          intensity === level
                            ? 'bg-brand-sage text-white border-brand-sage shadow-sm'
                            : 'bg-brand-bg/50 text-brand-text opacity-70 border-brand-gray-border hover:bg-brand-cream'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1">
                    Notes / Routine Details (Sets, reps, distances, etc.)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bench press 3x8, Pull-Ups 3x10..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive leading-relaxed font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-light-sand">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-[10px] font-bold border border-brand-gray-border text-brand-text opacity-70 rounded-xl hover:bg-brand-bg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold bg-brand-sage hover:bg-brand-dark text-white rounded-xl transition cursor-pointer disabled:opacity-55"
                  >
                    {isSaving ? (
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {isSaving ? 'Saving...' : editingWorkout ? 'Update' : 'Log Session'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Workouts History Feed */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {sortedWorkouts.length === 0 ? (
              <div className="text-center py-12 bg-white border border-brand-border rounded-[24px] soft-shadow">
                <Dumbbell className="mx-auto h-10 w-10 text-brand-olive opacity-40 mb-2.5" />
                <h3 className="text-xs font-semibold text-brand-sage">No workouts logged yet</h3>
                <p className="text-[10px] text-brand-text opacity-60 mt-1 max-w-[200px] mx-auto font-medium leading-relaxed">
                  Ready to sweat? Log a session or finish one in the Routine Tracker!
                </p>
              </div>
            ) : (
              sortedWorkouts.map((workout) => (
                <motion.div
                  key={workout.id || workout.rowIndex}
                  className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition group"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-brand-light-sand pb-1.5">
                      <span className="text-[9px] font-mono font-bold text-brand-text opacity-50 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-brand-olive" /> {workout.date}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(workout)}
                          className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-brand-sage rounded hover:bg-brand-bg cursor-pointer"
                          title="Edit Workout"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(workout)}
                          className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-red-600 rounded hover:bg-brand-bg cursor-pointer"
                          title="Delete Workout"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-brand-cream text-brand-sage rounded-lg">
                          <Dumbbell className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-brand-sage serif block leading-tight">{workout.type}</span>
                          {workout.day && (
                            <span className="text-[9px] text-brand-olive font-bold tracking-wide uppercase block mt-0.5">{workout.day}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-md ${intensityColorMap[workout.intensity]}`}>
                        {workout.intensity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-brand-text opacity-80 font-semibold bg-brand-cream/30 px-2 py-1.5 rounded-lg border border-brand-border/40">
                      <Clock className="h-3 w-3 text-brand-olive" />
                      <span>{workout.durationMinutes} minutes</span>
                    </div>

                    {workout.notes && (
                      <p className="text-[11px] text-brand-text opacity-90 leading-relaxed whitespace-pre-wrap pt-2 border-t border-brand-light-sand font-sans">
                        {workout.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

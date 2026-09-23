import React, { useState, useEffect, useRef } from 'react';
import { WorkoutEntry } from '../types';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  Check, 
  RotateCcw, 
  Play, 
  Pause, 
  ChevronRight, 
  Info, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Timer, 
  HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface RoutineTrackerProps {
  workouts: WorkoutEntry[];
  onAddWorkout: (entry: Omit<WorkoutEntry, 'rowIndex'>) => Promise<void>;
}

interface RecordedSet {
  weight: string;
  reps: string;
  completed: boolean;
}

interface DayWorkoutState {
  [exerciseId: string]: RecordedSet[];
}

const ROUTINES = {
  A: {
    letter: 'A',
    name: 'Day 1: Full Body A',
    exercises: [
      { id: 'db_bench', name: 'Dumbbell Bench Press', muscle: 'Chest', target: '3 sets of 8–12 reps' },
      { id: 'pullups', name: 'Banded/Bodyweight Pull-Ups', muscle: 'Back', target: '3 sets to failure (or 6–10 reps)', tip: 'See Pull-Up Progression Tab for band support guidelines.' },
      { id: 'goblet_squats', name: 'Dumbbell Goblet Squats', muscle: 'Legs', target: '3 sets of 10–12 reps' },
      { id: 'shoulder_press', name: 'Dumbbell Seated Shoulder Press', muscle: 'Shoulders', target: '3 sets of 8–12 reps' },
      { id: 'bicep_curls', name: 'Dumbbell Bicep Curls', muscle: 'Arms/Core', target: '3 sets of 10–12 reps' }
    ]
  },
  B: {
    letter: 'B',
    name: 'Day 2: Full Body B',
    exercises: [
      { id: 'romanian_deadlifts', name: 'Dumbbell Romanian Deadlifts', muscle: 'Legs (Posterior)', target: '3 sets of 10–12 reps', tip: 'Focus on the hip hinge' },
      { id: 'incline_bench', name: 'Incline Dumbbell Bench Press', muscle: 'Chest/Shoulders', target: '3 sets of 8–12 reps', tip: 'Set bench to a 30–45 degree angle' },
      { id: 'one_arm_rows', name: 'One-Arm Dumbbell Rows', muscle: 'Back', target: '3 sets of 10–12 reps per side', tip: 'Support yourself on the bench' },
      { id: 'bulgarian_squats', name: 'Dumbbell Bulgarian Split Squats', muscle: 'Legs (Quads)', target: '3 sets of 8–10 reps per leg', tip: 'Back foot elevated on the bench' },
      { id: 'tricep_extensions', name: 'Overhead DB Tricep Extension or Banded Pushdowns', muscle: 'Triceps', target: '3 sets of 12–15 reps' }
    ]
  },
  C: {
    letter: 'C',
    name: 'Day 3: Full Body C',
    exercises: [
      { id: 'chinups', name: 'Banded/Bodyweight Chin-Ups', muscle: 'Back', target: '3 sets of 6–10 reps', tip: 'Underhand grip—palms facing you' },
      { id: 'chest_flyes', name: 'Dumbbell Chest Flyes', muscle: 'Chest', target: '3 sets of 10–12 reps', tip: 'Lying flat on the bench' },
      { id: 'lunges', name: 'Dumbbell Lunges', muscle: 'Legs', target: '3 sets of 10 reps per leg', tip: 'Walking or reverse lunges' },
      { id: 'lateral_raises', name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', target: '3 sets of 12–15 reps' },
      { id: 'knee_raises', name: 'Hanging Knee Raises', muscle: 'Core', target: '3 sets of 10–15 reps', tip: 'Using your pull-up bar' }
    ]
  }
};

const PROGRESSION_STEPS = [
  {
    phase: 1,
    title: 'Phase 1: Heavy Band Support',
    description: 'Loop your thickest band over the bar, place your foot/knee in it, and hit 3 sets of 8–12 reps.',
    tip: 'Focus on a strong squeeze at the top of the pull-up, lowering under control.'
  },
  {
    phase: 2,
    title: 'Phase 2: Medium Band Support',
    description: 'Once Phase 1 is easy, switch to a medium/thinner band to reduce the assistance and target 6–8 reps.',
    tip: 'Keep your core braced so your body does not swing back and forth.'
  },
  {
    phase: 3,
    title: 'Phase 3: Light Band + Negatives',
    description: 'Switch to your thinnest band. Mix in "negatives" (jump or step to the top of the bar, then lower yourself down as slowly as possible—aim for a 5-second descent).',
    tip: 'Try to do 1-2 negatives at the end of each set to build that eccentric strength.'
  },
  {
    phase: 4,
    title: 'Phase 4: Bodyweight Pull-Up',
    description: 'Perform your first unassisted bodyweight rep! Aim to hit 3 sets of 6-10 reps as you progress.',
    tip: 'Congratulations! You are officially lifting your full bodyweight. Maintain consistent form.'
  }
];

export default function RoutineTracker({ workouts, onAddWorkout }: RoutineTrackerProps) {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'progression' | 'coach'>('A');

  // Exercise set tracking state
  const [workoutState, setWorkoutState] = useState<DayWorkoutState>(() => {
    const cached = localStorage.getItem('routine_workout_state_v1');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // use default empty
      }
    }
    return {};
  });

  // Track the start time of the active workout session to calculate duration automatically
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(() => {
    return localStorage.getItem('routine_session_start_time_v1') || null;
  });

  // Keep track of the current duration elapsed for display
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  // Rest Timer State
  const [timerDuration, setTimerDuration] = useState<number>(90); // default 90s
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<any>(null);

  // Pull-up progression states
  const [currentPullupPhase, setCurrentPullupPhase] = useState<number>(() => {
    return Number(localStorage.getItem('routine_pullup_phase_v1')) || 1;
  });
  const [progressionNotes, setProgressionNotes] = useState<string>(() => {
    return localStorage.getItem('routine_progression_notes_v1') || '';
  });

  // Form states for final logging
  const [logIntensity, setLogIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // In-app alert/confirmation states
  const [modalAlert, setModalAlert] = useState<{ title: string; message: string; isError?: boolean } | null>(null);
  const [modalConfirm, setModalConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Save state to localStorage on update
  useEffect(() => {
    localStorage.setItem('routine_workout_state_v1', JSON.stringify(workoutState));
  }, [workoutState]);

  useEffect(() => {
    if (sessionStartTime) {
      localStorage.setItem('routine_session_start_time_v1', sessionStartTime);
    } else {
      localStorage.removeItem('routine_session_start_time_v1');
    }
  }, [sessionStartTime]);

  useEffect(() => {
    localStorage.setItem('routine_pullup_phase_v1', currentPullupPhase.toString());
  }, [currentPullupPhase]);

  useEffect(() => {
    localStorage.setItem('routine_progression_notes_v1', progressionNotes);
  }, [progressionNotes]);

  // Handle session duration ticking
  useEffect(() => {
    let interval: any = null;
    if (sessionStartTime) {
      const calculateElapsed = () => {
        const start = new Date(sessionStartTime).getTime();
        const now = new Date().getTime();
        setElapsedMinutes(Math.max(1, Math.floor((now - start) / 60000)));
      };
      calculateElapsed();
      interval = setInterval(calculateElapsed, 10000); // update every 10 seconds
    } else {
      setElapsedMinutes(0);
    }
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Handle rest timer countdown
  useEffect(() => {
    if (isTimerRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            clearInterval(timerIntervalRef.current);
            playCompletionBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerRemaining]);

  // Play a browser native beep sound when rest is finished
  const playCompletionBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      
      // Secondary little higher beep for premium chime feel
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, ctx.currentTime); // C#6 note
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      }, 150);
    } catch (err) {
      console.warn('Audio feedback failed. Web Audio requires user interaction first.', err);
    }
  };

  // Start active workout session
  const handleStartWorkout = () => {
    setSessionStartTime(new Date().toISOString());
  };

  // Retrieve an exercise state or return 3 default empty sets
  const getExerciseState = (exId: string): RecordedSet[] => {
    return workoutState[exId] || [
      { weight: '', reps: '', completed: false },
      { weight: '', reps: '', completed: false },
      { weight: '', reps: '', completed: false }
    ];
  };

  // Update a single set's fields
  const handleUpdateSet = (exId: string, setIndex: number, fields: Partial<RecordedSet>) => {
    const currentState = getExerciseState(exId);
    const updated = [...currentState];
    const previousCompleted = updated[setIndex].completed;

    updated[setIndex] = {
      ...updated[setIndex],
      ...fields
    };

    // Auto-trigger rest timer if a set is newly marked as "completed"
    if (fields.completed === true && !previousCompleted) {
      startRestTimer();
    }

    setWorkoutState({
      ...workoutState,
      [exId]: updated
    });
  };

  // Start the rest timer helper
  const startRestTimer = () => {
    setTimerRemaining(timerDuration);
    setIsTimerRunning(true);
  };

  // Reset current active day's sets
  const handleResetDay = (dayLetter: 'A' | 'B' | 'C') => {
    setModalConfirm({
      title: 'Clear Logged Sets?',
      message: 'Are you sure you want to clear all logged weights and repetitions for this routine? This will wipe your inputs for today.',
      onConfirm: () => {
        const routine = ROUTINES[dayLetter];
        const updatedState = { ...workoutState };
        routine.exercises.forEach(ex => {
          updatedState[ex.id] = [
            { weight: '', reps: '', completed: false },
            { weight: '', reps: '', completed: false },
            { weight: '', reps: '', completed: false }
          ];
        });
        setWorkoutState(updatedState);
        setModalConfirm(null);
      }
    });
  };

  // Actual execution of sheets sync helper
  const executeFinishAndSync = async (dayLetter: 'A' | 'B' | 'C', duration: number) => {
    const routine = ROUTINES[dayLetter];
    setIsSubmitting(true);
    try {
      // Build a detailed formatted notes text of their lifts for progressive overload tracking
      let notesBuffer = `Routine: ${routine.name}\n\n`;

      routine.exercises.forEach((ex, idx) => {
        const sets = getExerciseState(ex.id);
        const completedSets = sets.filter(s => s.completed || s.weight.trim() !== '' || s.reps.trim() !== '');
        
        if (completedSets.length > 0) {
          const setsSummary = completedSets.map((s, i) => {
            const w = s.weight.trim() ? `${s.weight.trim()} lbs` : 'BW';
            const r = s.reps.trim() ? `${s.reps.trim()} reps` : 'Completed';
            return `Set ${i + 1}: ${w} x ${r}`;
          }).join(', ');
          notesBuffer += `${idx + 1}. ${ex.name}: ${setsSummary} (Target: ${ex.target})\n`;
        } else {
          notesBuffer += `${idx + 1}. ${ex.name}: Skipped / Not performed\n`;
        }
      });

      // Add pullup progression context if they logged Day A or C which has pullup/chinups
      if (dayLetter === 'A' || dayLetter === 'C') {
        notesBuffer += `\nPull-Up Progression Path: Phase ${currentPullupPhase} (${PROGRESSION_STEPS[currentPullupPhase - 1].title})\n`;
      }

      const todayString = getMountainDateString();
      const workoutId = 'routine_' + Math.random().toString(36).substr(2, 9);

      // Save Workout Entry
      await onAddWorkout({
        id: workoutId,
        date: todayString,
        type: 'Weights',
        day: `Day ${dayLetter}`,
        durationMinutes: duration,
        intensity: logIntensity,
        notes: notesBuffer.trim()
      });

      // Clear workout state for this day so it's clean for next time
      const clearedState = { ...workoutState };
      routine.exercises.forEach(ex => {
        clearedState[ex.id] = [
          { weight: '', reps: '', completed: false },
          { weight: '', reps: '', completed: false },
          { weight: '', reps: '', completed: false }
        ];
      });
      setWorkoutState(clearedState);
      setSessionStartTime(null); // Reset session timer
      
      setModalAlert({
        title: 'Workout Logged & Synced!',
        message: 'Your training routine has been successfully synced to your Google Sheet database. Progressive Overload stats will update instantly!'
      });
      setActiveTab('A'); // default back
    } catch (err) {
      console.error(err);
      setModalAlert({
        title: 'Sync Failed',
        message: 'Failed to sync workout to Google Sheets. Please ensure your internet connection is stable.',
        isError: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save and upload to Google Sheets
  const handleFinishAndSync = async (dayLetter: 'A' | 'B' | 'C') => {
    const routine = ROUTINES[dayLetter];
    
    // Check if any sets were logged
    let anyCompleted = false;
    routine.exercises.forEach(ex => {
      const sets = getExerciseState(ex.id);
      if (sets.some(s => s.completed || s.weight.trim() !== '' || s.reps.trim() !== '')) {
        anyCompleted = true;
      }
    });

    if (!anyCompleted) {
      setModalAlert({
        title: 'No Completed Sets',
        message: 'Please complete and log at least one set before syncing your session! Make sure to type reps/weight or click the checkmark.',
        isError: true
      });
      return;
    }

    const duration = elapsedMinutes > 0 ? elapsedMinutes : 45;
    
    setModalConfirm({
      title: 'Sync Workout Session?',
      message: `Ready to submit this Day ${dayLetter} workout? This will save all completed sets directly into your Google Sheets 'Workouts' sheet! We detected a session duration of ${duration} minutes.`,
      onConfirm: () => {
        setModalConfirm(null);
        executeFinishAndSync(dayLetter, duration);
      }
    });
  };

  // Heuristic parsing of history to find last lifted stats for any given exercise
  const findPreviousLifts = (exerciseName: string): string => {
    // Sort workouts by date descending
    const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    
    for (const workout of sortedWorkouts) {
      if (workout.notes && workout.notes.includes(exerciseName)) {
        const lines = workout.notes.split('\n');
        const exerciseLine = lines.find(line => line.includes(exerciseName));
        if (exerciseLine) {
          // Extract the portion after the colon
          // E.g. "1. Dumbbell Bench Press: Set 1: 30 lbs x 10 reps, Set 2: 30 lbs x 9 reps..."
          const splitByColon = exerciseLine.split(':');
          if (splitByColon.length > 1) {
            // Take everything after the exercise name
            // Join in case of multiple colons
            let details = splitByColon.slice(1).join(':').trim();
            // Remove target details inside parentheses if any to shorten the preview
            details = details.replace(/\s*\(Target:.*\)/i, '');
            return details;
          }
          return exerciseLine.trim();
        }
      }
    }
    return 'No previous data';
  };

  const activeRoutine = activeTab === 'A' || activeTab === 'B' || activeTab === 'C' ? ROUTINES[activeTab] : null;

  return (
    <div className="space-y-6">
      {/* Tracker Menu/Header Selector */}
      <div className="bg-white p-2.5 rounded-2xl border border-brand-border soft-shadow flex flex-wrap gap-1.5 justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {(['A', 'B', 'C'] as const).map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveTab(letter)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeTab === letter
                  ? 'bg-brand-sage text-white shadow-sm'
                  : 'text-brand-text opacity-75 hover:bg-brand-cream/50'
              }`}
            >
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Day {letter}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'progression'
                ? 'bg-brand-sage text-white shadow-sm'
                : 'text-brand-text opacity-75 hover:bg-brand-cream/50'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Pull-Up Path</span>
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'coach'
                ? 'bg-brand-sage text-white shadow-sm'
                : 'text-brand-text opacity-75 hover:bg-brand-cream/50'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Overload Guide</span>
          </button>
        </div>

        {/* Small Active Session Timer */}
        {sessionStartTime ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200/50 rounded-xl text-xs font-mono font-bold animate-pulse">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>Active: {elapsedMinutes}m elapsed</span>
          </div>
        ) : (
          activeRoutine && (
            <button
              onClick={handleStartWorkout}
              className="px-3 py-1.5 bg-brand-olive text-white hover:bg-brand-sage rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Play className="h-3 w-3" /> Start Workout Timer
            </button>
          )
        )}
      </div>

      {/* RENDER ACTIVE ROUTINE DAY (A, B, or C) */}
      {activeRoutine && (
        <div className="space-y-6">
          <div className="bg-brand-cream/40 p-4 rounded-[24px] border border-brand-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-brand-sage serif">{activeRoutine.name}</h2>
              <p className="text-xs text-brand-text opacity-75 mt-0.5 font-medium">
                Home training session focused on structural progressive overload. Adjust dumbbell weight & reps as necessary.
              </p>
            </div>
            
            {/* Rest Timer Settings inside Active Day */}
            <div className="bg-white px-4 py-2.5 rounded-xl border border-brand-border flex items-center gap-3 self-stretch sm:self-auto justify-between">
              <div className="flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-brand-olive" />
                <span className="text-[11px] font-bold text-brand-sage">Rest Timer:</span>
              </div>
              <select
                value={timerDuration}
                onChange={(e) => setTimerDuration(Number(e.target.value))}
                className="text-xs font-bold text-brand-text bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value={60}>60 Seconds</option>
                <option value={90}>90 Seconds (Recommended)</option>
                <option value={120}>2 Minutes</option>
                <option value={150}>2.5 Minutes</option>
                <option value={180}>3 Minutes</option>
              </select>
            </div>
          </div>

          {/* List of Exercises */}
          <div className="space-y-4">
            {activeRoutine.exercises.map((exercise, idx) => {
              const sets = getExerciseState(exercise.id);
              const prevLift = findPreviousLifts(exercise.name);

              return (
                <div 
                  key={exercise.id}
                  className="bg-white p-5 rounded-[28px] border border-brand-border soft-shadow space-y-4 hover:border-brand-olive/30 transition duration-200"
                >
                  {/* Exercise Info */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-brand-light-sand pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-brand-olive bg-brand-cream px-2 py-0.5 rounded-lg">
                          Exercise {idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-brand-sage/80 bg-brand-sand/40 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          {exercise.muscle}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-brand-sage mt-1.5 serif">
                        {exercise.name}
                      </h3>
                      {exercise.tip && (
                        <p className="text-[11px] text-brand-olive font-medium mt-1 italic">
                          💡 {exercise.tip}
                        </p>
                      )}
                    </div>

                    {/* Previous Stat Display */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text opacity-50 block">
                        Last Session Lifted
                      </span>
                      <span className="text-xs font-mono font-semibold text-brand-sage bg-brand-bg px-2.5 py-1 rounded-lg mt-1 inline-block border border-brand-border">
                        {prevLift}
                      </span>
                    </div>
                  </div>

                  {/* Grid of Sets */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[360px]">
                      <thead>
                        <tr className="border-b border-brand-border">
                          <th className="py-2 text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider w-12 text-center">Set</th>
                          <th className="py-2 text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider text-center w-28">Target</th>
                          <th className="py-2 text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider text-center">Weight (lbs)</th>
                          <th className="py-2 text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider text-center">Reps</th>
                          <th className="py-2 text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider text-center w-16">Done</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sets.map((set, setIdx) => (
                          <tr key={setIdx} className="border-b border-brand-border/40 last:border-none">
                            <td className="py-2 text-center font-mono text-xs font-bold text-brand-sage">
                              #{setIdx + 1}
                            </td>
                            <td className="py-2 text-center text-xs text-brand-text opacity-75 font-medium">
                              {exercise.target.split('sets of')[1]?.trim() || '8-12 reps'}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <input
                                type="text"
                                placeholder="lbs"
                                disabled={set.completed}
                                value={set.weight}
                                onChange={(e) => handleUpdateSet(exercise.id, setIdx, { weight: e.target.value })}
                                className="w-20 mx-auto px-2 py-1 text-center text-xs bg-brand-bg/50 border border-brand-gray-border rounded-lg outline-none focus:border-brand-olive font-semibold disabled:opacity-50 disabled:bg-gray-100"
                              />
                            </td>
                            <td className="py-1 px-2 text-center">
                              <input
                                type="text"
                                placeholder="reps"
                                disabled={set.completed}
                                value={set.reps}
                                onChange={(e) => handleUpdateSet(exercise.id, setIdx, { reps: e.target.value })}
                                className="w-20 mx-auto px-2 py-1 text-center text-xs bg-brand-bg/50 border border-brand-gray-border rounded-lg outline-none focus:border-brand-olive font-semibold disabled:opacity-50 disabled:bg-gray-100"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleUpdateSet(exercise.id, setIdx, { completed: !set.completed })}
                                className={`h-6 w-6 rounded-lg border flex items-center justify-center transition cursor-pointer mx-auto ${
                                  set.completed
                                    ? 'bg-brand-sage text-white border-brand-sage shadow-sm shadow-brand-sage/20'
                                    : 'border-brand-gray-border hover:border-brand-olive bg-white'
                                }`}
                              >
                                {set.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync & Log Dashboard */}
          <div className="bg-white p-6 rounded-[32px] border border-brand-border soft-shadow space-y-4">
            <h3 className="text-sm font-bold text-brand-sage flex items-center gap-2 serif">
              <Sparkles className="h-4 w-4 text-brand-olive" /> Finish & Log to Sheets
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Assigned Intensity
                </label>
                <div className="flex gap-1.5">
                  {(['Low', 'Medium', 'High'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setLogIntensity(level)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        logIntensity === level
                          ? 'bg-brand-sage text-white border-brand-sage shadow-md'
                          : 'bg-brand-bg/50 text-brand-text opacity-70 border-brand-gray-border hover:bg-brand-cream'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col justify-end">
                <p className="text-[11px] text-brand-text opacity-60 font-medium mb-1.5">
                  This will write detailed log entries of all checked sets directly to your Google Spreadsheet 'Workouts' sheet.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetDay(activeRoutine.letter as 'A' | 'B' | 'C')}
                    className="px-4 py-2.5 text-xs font-bold border border-brand-gray-border text-brand-text opacity-70 rounded-xl hover:bg-brand-bg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Clear Sets
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinishAndSync(activeRoutine.letter as 'A' | 'B' | 'C')}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md font-bold text-xs cursor-pointer transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>{isSubmitting ? 'Syncing to Sheets...' : 'Log & Sync Workout'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHIN-UP / PULL-UP PROGRESSION PATH */}
      {activeTab === 'progression' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-brand-border soft-shadow space-y-4">
            <div className="border-b border-brand-light-sand pb-4">
              <h2 className="text-base font-bold text-brand-sage serif flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-olive" />
                Chin-Up / Pull-Up Progression Path
              </h2>
              <p className="text-xs text-brand-text opacity-75 mt-1 font-medium">
                Can't do a bodyweight pull-up yet? Use resistance bands to decrease support systematically and construct real pulling strength.
              </p>
            </div>

            {/* Path Phases Steps */}
            <div className="space-y-4">
              {PROGRESSION_STEPS.map((step) => {
                const isActive = currentPullupPhase === step.phase;
                const isCompleted = currentPullupPhase > step.phase;

                return (
                  <div
                    key={step.phase}
                    onClick={() => setCurrentPullupPhase(step.phase)}
                    className={`p-4 rounded-2xl border transition duration-200 cursor-pointer flex gap-4 items-start ${
                      isActive 
                        ? 'border-brand-sage bg-brand-cream/30 ring-1 ring-brand-sage' 
                        : isCompleted
                        ? 'border-brand-border bg-brand-bg opacity-75'
                        : 'border-brand-border bg-white hover:border-brand-olive/40'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isActive 
                        ? 'bg-brand-sage text-white' 
                        : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-brand-bg text-brand-text opacity-60'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : step.phase}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-brand-sage">{step.title}</h3>
                        {isActive && (
                          <span className="text-[9px] font-bold text-white bg-brand-olive px-1.5 py-0.5 rounded-lg uppercase tracking-wider animate-pulse">
                            Active Phase
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-text opacity-85 leading-relaxed">{step.description}</p>
                      <p className="text-[10px] text-brand-olive font-medium italic mt-1">💡 Pro-Tip: {step.tip}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progression Notes box */}
            <div className="space-y-2 pt-2 border-t border-brand-light-sand">
              <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider">
                My Progression Logs (e.g. Band size, max unassisted reps)
              </label>
              <textarea
                value={progressionNotes}
                onChange={(e) => setProgressionNotes(e.target.value)}
                placeholder="Currently using the thick orange band for Day 1 Pull-ups. Got 10, 8, 8 reps today. Hoping to try the green medium band next week!"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
              />
              <p className="text-[10px] text-brand-text opacity-55 font-semibold text-right">
                Saved locally on your device
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESSIVE OVERLOAD COACH */}
      {activeTab === 'coach' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-brand-border soft-shadow space-y-4">
            <div className="border-b border-brand-light-sand pb-4">
              <h2 className="text-base font-bold text-brand-sage serif flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-olive" />
                Overload & Muscular Adaption Coach
              </h2>
              <p className="text-xs text-brand-text opacity-75 mt-1 font-medium">
                To build muscle and build systemic strength at home, you must systematically challenge your muscles. Here are your 4 direct avenues of progression:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tip 1 */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-lg bg-brand-sage text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-bold text-brand-sage">Add Dumbbell Weight</h3>
                </div>
                <p className="text-xs text-brand-text opacity-85 leading-relaxed">
                  Moving to heavier dumbbells is the most direct form of overload. Try increasing weight by 2.5–5 lbs once you comfortably reach the upper rep limit across all 3 sets.
                </p>
              </div>

              {/* Tip 2 */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-lg bg-brand-sage text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-bold text-brand-sage">Increase Repetitions</h3>
                </div>
                <p className="text-xs text-brand-text opacity-85 leading-relaxed">
                  If the weight is challenging, work on reps first. E.g., if you did 8 reps on chest press last week, try for 9 or 10 reps this week with the same weight.
                </p>
              </div>

              {/* Tip 3 */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-lg bg-brand-sage text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-xs font-bold text-brand-sage">Increase Time Under Tension (TUT)</h3>
                </div>
                <p className="text-xs text-brand-text opacity-85 leading-relaxed">
                  Slow down your movements! Take 3 to 4 seconds to lower the weights during the eccentric (lowering) phase. This stimulates deeper fibers without requiring heavier plates.
                </p>
              </div>

              {/* Tip 4 */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-lg bg-brand-sage text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h3 className="text-xs font-bold text-brand-sage">Decrease Band Support</h3>
                </div>
                <p className="text-xs text-brand-text opacity-85 leading-relaxed">
                  For bodyweight pulling, reducing assistance acts exactly like adding plate weight. Progress from heavy assistance bands to medium bands, light bands, and finally raw unassisted bodyweight reps.
                </p>
              </div>
            </div>

            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border text-xs text-brand-sage leading-relaxed font-semibold">
              ⭐ <span className="font-bold">Summary Rule of Thumb:</span> Try to beat your previous workout's performance in at least ONE exercise every single training session. Use the "Last Session Lifted" values on each exercise card to guide your targets!
            </div>
          </div>
        </div>
      )}

      {/* REST TIMER FLOATING CARD / FOOTER (Shows when timer is running/paused) */}
      <AnimatePresence>
        {timerRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-brand-dark text-white p-4 rounded-3xl border border-brand-sage/20 shadow-2xl flex items-center gap-4 max-w-sm"
          >
            <div className="relative h-12 w-12 flex items-center justify-center bg-brand-sage rounded-full overflow-hidden shrink-0">
              <span className="font-mono text-sm font-bold">{timerRemaining}s</span>
              <div 
                className="absolute inset-0 bg-white/10 origin-bottom transition-all duration-1000"
                style={{ height: `${(timerRemaining / timerDuration) * 100}%` }}
              ></div>
            </div>

            <div className="space-y-1 pr-2">
              <h4 className="text-xs font-bold text-white/95">Rest Period Active</h4>
              <p className="text-[10px] text-white/65">Stay hydrated, control your breathing, and get ready for the next set.</p>
              
              <div className="flex gap-2 pt-1.5">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition"
                >
                  {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{isTimerRunning ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  onClick={() => { setTimerRemaining(0); setIsTimerRunning(false); }}
                  className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/40 text-[10px] font-bold rounded-lg cursor-pointer transition"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DIALOG OVERLAY */}
      <AnimatePresence>
        {modalConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full p-6 rounded-[28px] border border-brand-border shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-brand-light-sand">
                <HelpCircle className="h-5 w-5 text-brand-olive animate-bounce" />
                <h3 className="text-sm font-bold text-brand-sage serif">{modalConfirm.title}</h3>
              </div>
              <p className="text-xs text-brand-text opacity-85 leading-relaxed font-semibold">
                {modalConfirm.message}
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalConfirm(null)}
                  className="px-3.5 py-2 text-xs font-bold border border-brand-gray-border text-brand-text opacity-70 rounded-xl hover:bg-brand-bg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={modalConfirm.onConfirm}
                  className="px-4 py-2 text-xs font-bold bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  Yes, Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM ALERT DIALOG OVERLAY */}
      <AnimatePresence>
        {modalAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full p-6 rounded-[28px] border border-brand-border shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-brand-light-sand">
                <Sparkles className={`h-5 w-5 ${modalAlert.isError ? 'text-red-500' : 'text-brand-olive animate-pulse'}`} />
                <h3 className={`text-sm font-bold serif ${modalAlert.isError ? 'text-red-600' : 'text-brand-sage'}`}>{modalAlert.title}</h3>
              </div>
              <p className="text-xs text-brand-text opacity-85 leading-relaxed font-semibold">
                {modalAlert.message}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalAlert(null)}
                  className="px-5 py-2 text-xs font-bold bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

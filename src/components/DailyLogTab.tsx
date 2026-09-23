import React, { useState, useEffect, useMemo } from 'react';
import { LifeOSData, HabitEntry, DiaryEntry, WorkoutEntry, MediaEntry, BookEntry } from '../types';
import { 
  ClipboardEdit, 
  Calendar, 
  Moon, 
  Droplets, 
  Brain, 
  Utensils, 
  Monitor, 
  Smile, 
  Heart, 
  Dumbbell, 
  Flame, 
  Clock, 
  Film, 
  BookOpen, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface DailyLogTabProps {
  data: LifeOSData;
  onAddHabit: (entry: Omit<HabitEntry, 'rowIndex'>) => Promise<void>;
  onUpdateHabit: (entry: HabitEntry) => Promise<void>;
  onAddDiary: (entry: Omit<DiaryEntry, 'rowIndex'>) => Promise<void>;
  onUpdateDiary: (entry: DiaryEntry) => Promise<void>;
  onAddWorkout: (entry: Omit<WorkoutEntry, 'rowIndex'>) => Promise<void>;
  onUpdateWorkout: (entry: WorkoutEntry) => Promise<void>;
  onAddMedia: (entry: Omit<MediaEntry, 'rowIndex'>) => Promise<void>;
  onAddBook: (entry: Omit<BookEntry, 'rowIndex'>) => Promise<void>;
  onUpdateBook: (entry: BookEntry) => Promise<void>;
  onNavigateToTab: (tabId: string) => void;
}

export default function DailyLogTab({
  data,
  onAddHabit,
  onUpdateHabit,
  onAddDiary,
  onUpdateDiary,
  onAddWorkout,
  onUpdateWorkout,
  onAddMedia,
  onAddBook,
  onUpdateBook,
  onNavigateToTab
}: DailyLogTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getMountainDateString());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Check what already exists for the selected date
  const existingHabit = useMemo(() => 
    (data.habits || []).find(h => h.date === selectedDate),
    [data.habits, selectedDate]
  );

  const existingDiary = useMemo(() => 
    data.diary.find(d => d.date === selectedDate),
    [data.diary, selectedDate]
  );

  const existingWorkout = useMemo(() => 
    data.workouts.find(w => w.date === selectedDate),
    [data.workouts, selectedDate]
  );

  // -------------------------------------------------------------
  // FORM STATES
  // -------------------------------------------------------------

  // 1. Habits State
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [waterLiters, setWaterLiters] = useState<number>(2.0);
  const [meditation, setMeditation] = useState<boolean>(false);
  const [mindfulEating, setMindfulEating] = useState<boolean>(false);
  const [screenTimeMins, setScreenTimeMins] = useState<number>(120);

  // 2. Diary State
  const [mood, setMood] = useState<number>(3);
  const [summary, setSummary] = useState<string>('');
  const [gratitude, setGratitude] = useState<string>('');

  // 3. Workout State
  const [includeWorkout, setIncludeWorkout] = useState<boolean>(false);
  const [workoutType, setWorkoutType] = useState<string>('Weights');
  const [workoutDay, setWorkoutDay] = useState<string>('');
  const [workoutDuration, setWorkoutDuration] = useState<number>(45);
  const [workoutIntensity, setWorkoutIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [workoutNotes, setWorkoutNotes] = useState<string>('');

  // 4. Media & Entertainment (Optional Quick Log)
  const [includeMedia, setIncludeMedia] = useState<boolean>(false);
  const [mediaTitle, setMediaTitle] = useState<string>('');
  const [mediaType, setMediaType] = useState<'Movie' | 'TV Show'>('Movie');
  const [mediaRating, setMediaRating] = useState<number>(4);
  const [mediaReview, setMediaReview] = useState<string>('');

  // 5. Reading (Optional Quick Update)
  const [includeBook, setIncludeBook] = useState<boolean>(false);
  const [bookMode, setBookMode] = useState<'update' | 'new'>('update');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [bookProgress, setBookProgress] = useState<number>(50);
  const [newBookTitle, setNewBookTitle] = useState<string>('');
  const [newBookAuthor, setNewBookAuthor] = useState<string>('');
  const [newBookFormat, setNewBookFormat] = useState<'Physical' | 'Kindle' | 'Audiobook' | 'E-book'>('Physical');

  // Active books list for update dropdown
  const activeBooks = useMemo(() => 
    data.books.filter(b => b.status === 'Reading' || b.status === 'To Read'),
    [data.books]
  );

  // Pre-populate fields whenever selectedDate or existing records change
  useEffect(() => {
    // Habits
    if (existingHabit) {
      setSleepHours(existingHabit.sleepHours);
      setWaterLiters(existingHabit.waterLiters);
      setMeditation(existingHabit.meditation);
      setMindfulEating(existingHabit.mindfulEating);
      setScreenTimeMins(existingHabit.screenTimeMins);
    } else {
      setSleepHours(7.5);
      setWaterLiters(2.0);
      setMeditation(false);
      setMindfulEating(false);
      setScreenTimeMins(120);
    }

    // Diary
    if (existingDiary) {
      setMood(existingDiary.mood);
      setSummary(existingDiary.summary || '');
      setGratitude(existingDiary.gratitude || '');
    } else {
      setMood(3);
      setSummary('');
      setGratitude('');
    }

    // Workout
    if (existingWorkout) {
      setIncludeWorkout(true);
      setWorkoutType(existingWorkout.type || 'Weights');
      setWorkoutDay(existingWorkout.day || '');
      setWorkoutDuration(existingWorkout.durationMinutes || 45);
      setWorkoutIntensity(existingWorkout.intensity || 'Medium');
      setWorkoutNotes(existingWorkout.notes || '');
    } else {
      setIncludeWorkout(false);
      setWorkoutType('Weights');
      setWorkoutDay('');
      setWorkoutDuration(45);
      setWorkoutIntensity('Medium');
      setWorkoutNotes('');
    }

    // Reset optional media / book entries
    setIncludeMedia(false);
    setMediaTitle('');
    setMediaReview('');
    setMediaRating(4);

    setIncludeBook(false);
    if (activeBooks.length > 0) {
      setSelectedBookId(activeBooks[0].id);
      setBookProgress(activeBooks[0].progress);
    }
  }, [selectedDate, existingHabit, existingDiary, existingWorkout, activeBooks]);

  // When selected book in dropdown changes, update progress slider default
  const handleSelectedBookChange = (id: string) => {
    setSelectedBookId(id);
    const book = data.books.find(b => b.id === id);
    if (book) {
      setBookProgress(book.progress);
    }
  };

  // Quick date change helpers
  const handleSetToday = () => setSelectedDate(getMountainDateString());
  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(getMountainDateString(d));
  };

  // -------------------------------------------------------------
  // UNIFIED SUBMIT
  // -------------------------------------------------------------
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSaving(true);
    setSaveSuccessMessage(null);

    const savedItems: string[] = [];

    try {
      // 1. Save Habits
      if (existingHabit && existingHabit.rowIndex) {
        await onUpdateHabit({
          ...existingHabit,
          date: selectedDate,
          sleepHours: Number(sleepHours) || 0,
          waterLiters: Number(waterLiters) || 0,
          meditation,
          mindfulEating,
          screenTimeMins: Number(screenTimeMins) || 0
        });
        savedItems.push('Habits (Updated)');
      } else {
        await onAddHabit({
          date: selectedDate,
          sleepHours: Number(sleepHours) || 0,
          waterLiters: Number(waterLiters) || 0,
          meditation,
          mindfulEating,
          screenTimeMins: Number(screenTimeMins) || 0
        });
        savedItems.push('Habits (Logged)');
      }

      // 2. Save Diary (if filled or previously existed)
      if (summary.trim() || gratitude.trim() || existingDiary) {
        if (existingDiary && existingDiary.rowIndex) {
          await onUpdateDiary({
            ...existingDiary,
            date: selectedDate,
            mood,
            summary: summary.trim(),
            gratitude: gratitude.trim()
          });
          savedItems.push('Journal (Updated)');
        } else {
          await onAddDiary({
            date: selectedDate,
            mood,
            summary: summary.trim(),
            gratitude: gratitude.trim(),
            workoutLinked: '',
            mediaLinked: '',
            bookLinked: ''
          });
          savedItems.push('Journal (Logged)');
        }
      }

      // 3. Save Workout (if toggled)
      if (includeWorkout && workoutDuration > 0) {
        if (existingWorkout && existingWorkout.rowIndex) {
          await onUpdateWorkout({
            ...existingWorkout,
            date: selectedDate,
            type: workoutType,
            day: workoutDay.trim(),
            durationMinutes: Number(workoutDuration) || 0,
            intensity: workoutIntensity,
            notes: workoutNotes.trim()
          });
          savedItems.push('Workout (Updated)');
        } else {
          await onAddWorkout({
            id: `WO-${Date.now()}`,
            date: selectedDate,
            type: workoutType,
            day: workoutDay.trim(),
            durationMinutes: Number(workoutDuration) || 0,
            intensity: workoutIntensity,
            notes: workoutNotes.trim()
          });
          savedItems.push('Workout (Logged)');
        }
      }

      // 4. Save Media (if toggled)
      if (includeMedia && mediaTitle.trim()) {
        await onAddMedia({
          id: `MED-${Date.now()}`,
          dateWatched: selectedDate,
          title: mediaTitle.trim(),
          type: mediaType,
          rating: mediaRating,
          status: 'Completed',
          review: mediaReview.trim()
        });
        savedItems.push(`Media ("${mediaTitle.trim()}")`);
        setIncludeMedia(false);
        setMediaTitle('');
        setMediaReview('');
      }

      // 5. Save Book (if toggled)
      if (includeBook) {
        if (bookMode === 'update' && selectedBookId) {
          const targetBook = data.books.find(b => b.id === selectedBookId);
          if (targetBook && targetBook.rowIndex) {
            const isFinished = bookProgress >= 100;
            await onUpdateBook({
              ...targetBook,
              progress: Number(bookProgress),
              status: isFinished ? 'Completed' : 'Reading',
              dateFinished: isFinished ? selectedDate : targetBook.dateFinished
            });
            savedItems.push(`Book Updated ("${targetBook.title}")`);
            setIncludeBook(false);
          }
        } else if (bookMode === 'new' && newBookTitle.trim()) {
          await onAddBook({
            id: `BK-${Date.now()}`,
            dateLogged: selectedDate,
            title: newBookTitle.trim(),
            author: newBookAuthor.trim(),
            format: newBookFormat,
            progress: Number(bookProgress) || 0,
            status: Number(bookProgress) >= 100 ? 'Completed' : 'Reading',
            keyTakeaways: '',
            dateFinished: Number(bookProgress) >= 100 ? selectedDate : ''
          });
          savedItems.push(`New Book Added ("${newBookTitle.trim()}")`);
          setIncludeBook(false);
          setNewBookTitle('');
          setNewBookAuthor('');
        }
      }

      setSaveSuccessMessage(
        `Successfully synced ${savedItems.join(', ')} for ${selectedDate} to your Google Sheets!`
      );
      // Auto-hide success banner after 6 seconds
      setTimeout(() => setSaveSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Failed to save daily check-in:', err);
      alert('Failed to sync entries to Google Sheets. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const moodOptions = [
    { score: 5, label: 'Great', emoji: '✦' },
    { score: 4, label: 'Good', emoji: '✧' },
    { score: 3, label: 'Neutral', emoji: '◈' },
    { score: 2, label: 'Meh', emoji: '◇' },
    { score: 1, label: 'Rough', emoji: '○' }
  ];

  return (
    <div className="space-y-8 font-sans pb-16 max-w-4xl mx-auto">
      {/* Header & Date Selector */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-light-sand pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="sans text-[10px] opacity-60 uppercase tracking-widest font-bold font-mono">
              Unified Daily Input
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-cream text-brand-sage text-[9px] font-bold">
              <ClipboardEdit className="h-3 w-3" /> All-in-One Form
            </span>
          </div>
          <h2 className="serif text-3xl font-bold text-brand-sage tracking-tight">
            Daily Check-In
          </h2>
          <p className="text-xs text-brand-text/70 mt-1 max-w-xl">
            Input your habits, journal reflection, workouts, and media all in one place without jumping across separate tabs.
          </p>
        </div>

        {/* Date Selection Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2 rounded-2xl border border-brand-border soft-shadow">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSetYesterday}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                selectedDate !== getMountainDateString() ? 'bg-brand-sand/60 text-brand-sage' : 'hover:bg-brand-sand/30 text-brand-text/60'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                selectedDate === getMountainDateString() ? 'bg-brand-sage text-white shadow-sm' : 'hover:bg-brand-sand/30 text-brand-text/60'
              }`}
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1.5 pl-2 sm:border-l border-brand-border">
            <Calendar className="h-4 w-4 text-brand-olive shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-brand-sage bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {saveSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-brand-cream border border-brand-border rounded-2xl flex items-center justify-between text-brand-sage text-xs font-bold soft-shadow"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-brand-sage shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => onNavigateToTab('overview')}
              className="text-[11px] underline hover:text-brand-dark cursor-pointer font-bold shrink-0 ml-4"
            >
              View in Overview &rarr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar for Selected Date */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">
          Status for {selectedDate}:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            existingHabit ? 'bg-brand-cream text-brand-sage border border-brand-border' : 'bg-brand-sand/40 text-brand-text/50'
          }`}>
            <Moon className="h-3 w-3" /> {existingHabit ? 'Habits Logged' : 'Habits Blank'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            existingDiary ? 'bg-brand-cream text-brand-sage border border-brand-border' : 'bg-brand-sand/40 text-brand-text/50'
          }`}>
            <Smile className="h-3 w-3" /> {existingDiary ? 'Journal Logged' : 'Journal Blank'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            existingWorkout ? 'bg-brand-cream text-brand-sage border border-brand-border' : 'bg-brand-sand/40 text-brand-text/50'
          }`}>
            <Dumbbell className="h-3 w-3" /> {existingWorkout ? 'Workout Logged' : 'No Workout'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmitAll} className="space-y-8">
        
        {/* ========================================================= */}
        {/* SECTION 1: HABITS & WELLNESS */}
        {/* ========================================================= */}
        <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-brand-border soft-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="serif text-lg font-bold text-brand-sage">1. Daily Habits & Wellness</h3>
                <p className="text-[11px] text-brand-text/60">Sleep, hydration, screen usage, and daily mindful practices</p>
              </div>
            </div>
            {existingHabit && (
              <span className="text-[10px] font-bold bg-brand-cream text-brand-sage px-2 py-0.5 rounded-full border border-brand-border">
                Editing Existing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Sleep Hours */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-brand-sage" /> Sleep (Hours)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                required
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full input-field font-semibold text-xs"
                placeholder="7.5"
              />
              <span className="text-[10px] text-brand-text/40 block">Target: 7.5 – 8.5 hrs</span>
            </div>

            {/* Water Liters */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-brand-sage" /> Water (Liters)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                required
                value={waterLiters}
                onChange={(e) => setWaterLiters(Number(e.target.value))}
                className="w-full input-field font-semibold text-xs"
                placeholder="2.0"
              />
              <span className="text-[10px] text-brand-text/40 block">Target: 2.0+ Liters</span>
            </div>

            {/* Screen Time Mins */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-brand-sage" /> Screen Time (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="1440"
                required
                value={screenTimeMins}
                onChange={(e) => setScreenTimeMins(Number(e.target.value))}
                className="w-full input-field font-semibold text-xs"
                placeholder="120"
              />
              <span className="text-[10px] text-brand-text/40 block">{(screenTimeMins / 60).toFixed(1)} hrs total</span>
            </div>
          </div>

          {/* Habit Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setMeditation(!meditation)}
              className={`p-4 rounded-2xl border transition text-left flex items-center justify-between cursor-pointer ${
                meditation 
                  ? 'bg-brand-cream/80 border-brand-sage text-brand-sage font-bold' 
                  : 'bg-brand-bg border-brand-border text-brand-text/70 hover:border-brand-olive'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${meditation ? 'bg-brand-sage text-white' : 'bg-brand-sand text-brand-text/40'}`}>
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Meditation / Breathwork</p>
                  <p className="text-[10px] opacity-70">At least 5–10 mins of stillness</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${meditation ? 'bg-brand-sage text-white' : 'bg-brand-sand text-brand-text/40'}`}>
                {meditation ? '✓ Completed' : 'Not Done'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMindfulEating(!mindfulEating)}
              className={`p-4 rounded-2xl border transition text-left flex items-center justify-between cursor-pointer ${
                mindfulEating 
                  ? 'bg-brand-cream/80 border-brand-sage text-brand-sage font-bold' 
                  : 'bg-brand-bg border-brand-border text-brand-text/70 hover:border-brand-olive'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${mindfulEating ? 'bg-brand-sage text-white' : 'bg-brand-sand text-brand-text/40'}`}>
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Mindful Eating</p>
                  <p className="text-[10px] opacity-70">Ate without screen distraction</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${mindfulEating ? 'bg-brand-sage text-white' : 'bg-brand-sand text-brand-text/40'}`}>
                {mindfulEating ? '✓ Completed' : 'Not Done'}
              </span>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: JOURNAL & REFLECTION */}
        {/* ========================================================= */}
        <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-brand-border soft-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
                <Smile className="h-5 w-5" />
              </div>
              <div>
                <h3 className="serif text-lg font-bold text-brand-sage">2. Journal & Reflection</h3>
                <p className="text-[11px] text-brand-text/60">Capture your mood, daily stream of thought, and gratitude</p>
              </div>
            </div>
            {existingDiary && (
              <span className="text-[10px] font-bold bg-brand-cream text-brand-sage px-2 py-0.5 rounded-full border border-brand-border">
                Editing Existing
              </span>
            )}
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold block">
              Overall Mood
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map(option => {
                const isSelected = mood === option.score;
                return (
                  <button
                    key={option.score}
                    type="button"
                    onClick={() => setMood(option.score)}
                    className={`py-3 px-2 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-brand-sage text-white border-brand-sage shadow-sm scale-[1.02]'
                        : 'bg-brand-bg border-brand-border text-brand-text/70 hover:bg-brand-sand/50'
                    }`}
                  >
                    <span className="text-sm font-bold">{option.emoji}</span>
                    <span className="text-[11px] font-bold">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Summary */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold block">
              Today's Highlights & Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full input-field font-sans text-xs"
              placeholder="What made today noteworthy? What did you accomplish or learn?"
            />
          </div>

          {/* Gratitude */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-brand-sage" /> Gratitude & Wins
            </label>
            <textarea
              rows={2}
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              className="w-full input-field font-sans text-xs"
              placeholder="1-2 things you are grateful for today..."
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: WORKOUT & MOVEMENT */}
        {/* ========================================================= */}
        <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-brand-border soft-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="serif text-lg font-bold text-brand-sage">3. Workout & Fitness</h3>
                <p className="text-[11px] text-brand-text/60">Log training type, duration, and exercise notes</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div 
              onClick={() => setIncludeWorkout(!includeWorkout)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1.5 select-none ${
                includeWorkout ? 'bg-brand-sage text-white' : 'bg-brand-sand text-brand-text/60'
              }`}
            >
              <span>{includeWorkout ? '✓ Logging Workout' : '+ Log Workout'}</span>
            </div>
          </div>

          {includeWorkout ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold block">
                    Type
                  </label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full input-field text-xs font-bold text-brand-sage"
                  >
                    <option value="Weights">Weights / Strength</option>
                    <option value="Cardio">Cardio / HIIT</option>
                    <option value="Walk/Run">Running / Walking</option>
                    <option value="Yoga">Yoga / Mobility</option>
                    <option value="Sports">Sports / Cycling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(Number(e.target.value))}
                    className="w-full input-field text-xs font-bold"
                    placeholder="45"
                  />
                </div>

                {/* Intensity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold flex items-center gap-1">
                    <Flame className="h-3 w-3" /> Intensity
                  </label>
                  <select
                    value={workoutIntensity}
                    onChange={(e) => setWorkoutIntensity(e.target.value as any)}
                    className="w-full input-field text-xs font-bold text-brand-sage"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Routine Split & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold block">
                    Split / Target Routine (Optional)
                  </label>
                  <input
                    type="text"
                    value={workoutDay}
                    onChange={(e) => setWorkoutDay(e.target.value)}
                    className="w-full input-field text-xs"
                    placeholder="e.g. Day A, Push Day, Leg Day"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-brand-text/70 font-bold block">
                    Exercises & Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    className="w-full input-field text-xs"
                    placeholder="Bench press, squats, stretches..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-brand-text/50 italic">
              Rest day or no workout logged for this date. Click "+ Log Workout" above if you exercised!
            </p>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: READING & MEDIA QUICK LOG (OPTIONAL) */}
        {/* ========================================================= */}
        <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-brand-border soft-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="serif text-lg font-bold text-brand-sage">4. Reading & Media Quick Capture</h3>
                <p className="text-[11px] text-brand-text/60">Optional: Update reading milestones or log a film/series watched</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick Book Progress Update */}
            <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sage flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> Book Reading Log
                </span>
                <button
                  type="button"
                  onClick={() => setIncludeBook(!includeBook)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    includeBook ? 'bg-brand-sage text-white' : 'bg-brand-sand/60 text-brand-text/60'
                  }`}
                >
                  {includeBook ? '✓ Active' : '+ Add Book Log'}
                </button>
              </div>

              {includeBook && (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBookMode('update')}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        bookMode === 'update' ? 'bg-brand-sage text-white' : 'bg-brand-sand/40 text-brand-text/60'
                      }`}
                    >
                      Update Existing Book
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookMode('new')}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        bookMode === 'new' ? 'bg-brand-sage text-white' : 'bg-brand-sand/40 text-brand-text/60'
                      }`}
                    >
                      Log New Book
                    </button>
                  </div>

                  {bookMode === 'update' ? (
                    activeBooks.length > 0 ? (
                      <div className="space-y-3">
                        <select
                          value={selectedBookId}
                          onChange={(e) => handleSelectedBookChange(e.target.value)}
                          className="w-full input-field text-xs font-bold text-brand-sage"
                        >
                          {activeBooks.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.title} ({b.progress}%)
                            </option>
                          ))}
                        </select>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[10px] uppercase text-brand-text/60">New Progress</span>
                            <span className="text-brand-sage">{bookProgress}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={bookProgress}
                            onChange={(e) => setBookProgress(Number(e.target.value))}
                            className="w-full accent-brand-sage cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-brand-text/50 italic">
                        No active reading books found. Switch to "Log New Book" to start one!
                      </p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Book Title"
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        className="w-full input-field text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Author"
                        value={newBookAuthor}
                        onChange={(e) => setNewBookAuthor(e.target.value)}
                        className="w-full input-field text-xs"
                      />
                      <div className="flex justify-between items-center gap-2">
                        <select
                          value={newBookFormat}
                          onChange={(e) => setNewBookFormat(e.target.value as any)}
                          className="w-1/2 input-field text-xs font-semibold"
                        >
                          <option value="Physical">Physical</option>
                          <option value="Kindle">Kindle</option>
                          <option value="Audiobook">Audiobook</option>
                          <option value="E-book">E-book</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Progress %"
                          value={bookProgress}
                          onChange={(e) => setBookProgress(Number(e.target.value))}
                          className="w-1/2 input-field text-xs font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Media Log */}
            <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sage flex items-center gap-1.5">
                  <Film className="h-4 w-4" /> Movie or TV Show
                </span>
                <button
                  type="button"
                  onClick={() => setIncludeMedia(!includeMedia)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    includeMedia ? 'bg-brand-sage text-white' : 'bg-brand-sand/60 text-brand-text/60'
                  }`}
                >
                  {includeMedia ? '✓ Active' : '+ Add Media'}
                </button>
              </div>

              {includeMedia && (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Title of movie or series..."
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      className="w-2/3 input-field text-xs"
                    />
                    <select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value as any)}
                      className="w-1/3 input-field text-xs font-bold text-brand-sage"
                    >
                      <option value="Movie">Movie</option>
                      <option value="TV Show">TV Show</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-brand-text/60">Rating</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMediaRating(star)}
                          className="p-1 cursor-pointer text-brand-sage"
                        >
                          <Star 
                            className={`h-4 w-4 ${star <= mediaRating ? 'fill-brand-sage text-brand-sage' : 'text-brand-gray-border'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Short review / impression (optional)"
                    value={mediaReview}
                    onChange={(e) => setMediaReview(e.target.value)}
                    className="w-full input-field text-xs"
                  />
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* SUBMIT / SAVE ALL */}
        {/* ========================================================= */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-light-sand">
          <div className="text-xs text-brand-text/60">
            Saving updates will sync to your <b>Life OS Database</b> Google Sheet.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateToTab('overview')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-brand-sand border border-brand-border text-brand-text font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-sage hover:bg-brand-dark text-white font-bold text-xs transition cursor-pointer shadow-md shadow-brand-sage/15 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing to Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Daily Check-In</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

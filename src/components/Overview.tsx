import { useState } from 'react';
import { LifeOSData, DiaryEntry, WorkoutEntry, MediaEntry, BookEntry, HabitEntry } from '../types';
import { 
  Calendar, 
  Smile, 
  Dumbbell, 
  Film, 
  BookOpen, 
  Heart, 
  TrendingUp, 
  Clock, 
  Plus, 
  Sparkles, 
  ChevronRight,
  BookMarked,
  CheckSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface OverviewProps {
  data: LifeOSData;
  onNavigateToTab: (tab: string) => void;
  onQuickLogDiary: (date: string) => void;
}

export default function Overview({ data, onNavigateToTab, onQuickLogDiary }: OverviewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getMountainDateString();
  });

  // Calculate high level metrics
  const totalDiaries = data.diary.length;
  const avgMood = totalDiaries > 0 
    ? (data.diary.reduce((sum, d) => sum + d.mood, 0) / totalDiaries).toFixed(1) 
    : 'N/A';

  const totalWorkouts = data.workouts.length;
  const totalWorkoutMinutes = data.workouts.reduce((sum, w) => sum + w.durationMinutes, 0);

  const totalMedia = data.media.length;
  const completedMedia = data.media.filter(m => m.status === 'Completed').length;

  const totalBooks = data.books.length;
  const readingBooks = data.books.filter(b => b.status === 'Reading').length;

  // Filter items linked to selected date
  const dayDiary = data.diary.find(d => d.date === selectedDate);
  const dayWorkouts = data.workouts.filter(w => w.date === selectedDate);
  const dayMedia = data.media.filter(m => m.dateWatched === selectedDate);
  const dayBooks = data.books.filter(b => b.dateLogged === selectedDate || b.dateFinished === selectedDate);
  const dayHabit = data.habits?.find(h => h.date === selectedDate);

  // Combine all items into a chronological feed (last 15 items)
  const feedItems: Array<{
    type: 'diary' | 'workout' | 'media' | 'book' | 'habit';
    date: string;
    title: string;
    subtitle: string;
    detail: string;
    extra?: any;
    original: any;
  }> = [];

  data.diary.forEach(d => {
    feedItems.push({
      type: 'diary',
      date: d.date,
      title: `Daily Journal Entry`,
      subtitle: `Mood: ${getMoodEmoji(d.mood)} (${d.mood}/5)`,
      detail: d.summary || d.gratitude || 'Wrote in journal',
      extra: d.gratitude ? `Gratitude: ${d.gratitude}` : undefined,
      original: d
    });
  });

  data.workouts.forEach(w => {
    feedItems.push({
      type: 'workout',
      date: w.date,
      title: `${w.type} Workout`,
      subtitle: `${w.durationMinutes} mins • ${w.intensity} Intensity`,
      detail: w.notes || 'No notes added',
      original: w
    });
  });

  data.media.forEach(m => {
    feedItems.push({
      type: 'media',
      date: m.dateWatched,
      title: `${m.title} (${m.type})`,
      subtitle: `Rated ${'★'.repeat(m.rating)}${'☆'.repeat(5 - m.rating)} • ${m.status}`,
      detail: m.review || 'No review added',
      original: m
    });
  });

  data.books.forEach(b => {
    feedItems.push({
      type: 'book',
      date: b.dateFinished || b.dateLogged,
      title: `${b.title} by ${b.author}`,
      subtitle: `${b.format} • Progress: ${b.progress}% • ${b.status}`,
      detail: b.keyTakeaways ? `Takeaway: ${b.keyTakeaways}` : 'Updated reading status',
      original: b
    });
  });

  data.habits?.forEach(h => {
    feedItems.push({
      type: 'habit',
      date: h.date,
      title: `Daily Habits Log`,
      subtitle: `Sleep: ${h.sleepHours} hrs • Water: ${h.waterLiters} L • Screen: ${h.screenTimeMins} mins`,
      detail: `Meditation: ${h.meditation ? 'Yes' : 'No'} | Mindful Eating: ${h.mindfulEating ? 'Yes' : 'No'}`,
      original: h
    });
  });

  // Sort feed items descending by date
  feedItems.sort((a, b) => b.date.localeCompare(a.date));
  const recentFeed = feedItems.slice(0, 10);

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

  function getMoodGradient(mood: number) {
    switch (mood) {
      case 5: return 'bg-brand-sage text-white';
      case 4: return 'bg-brand-olive text-white animate-pulse-slow';
      case 3: return 'bg-brand-cream text-brand-sage border border-brand-gray-border/40';
      case 2: return 'bg-[#edebe1] text-brand-sage border border-brand-gray-border/30';
      case 1: return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-brand-cream text-brand-sage';
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Banner / Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-brand-light-sand pb-6 mb-8">
        <div>
          <p className="sans text-[10px] opacity-60 uppercase tracking-widest mb-1 font-bold">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="serif text-4xl font-bold text-brand-sage tracking-tight">
            Welcome Back.
          </h2>
          <p className="text-xs text-brand-text/70 mt-1 max-w-xl">
            A comprehensive unified database tracking your daily thoughts, fitness routines, media consumption, and literary journeys directly inside your personal Google Sheets.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToTab('diary')}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md shadow-brand-sage/10 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Log Journal
          </button>
          <button
            onClick={() => onNavigateToTab('workouts')}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-white hover:bg-brand-sand border border-brand-border rounded-xl text-brand-text transition cursor-pointer"
          >
            <Dumbbell className="h-4 w-4 text-brand-sage" /> Add Workout
          </button>
        </div>
      </header>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mood Card */}
        <div className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Avg Mood</span>
            <div className="p-2.5 bg-brand-cream rounded-xl text-brand-sage">
              <Smile className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold font-display serif text-brand-sage">{avgMood}</span>
            <span className="text-[10px] text-brand-text/60 block mt-0.5 font-medium">from {totalDiaries} logs</span>
          </div>
        </div>

        {/* Workouts Card */}
        <div className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Fitness Tracker</span>
            <div className="p-2.5 bg-brand-cream rounded-xl text-brand-sage">
              <Dumbbell className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold font-display serif text-brand-sage">{totalWorkouts}</span>
              <span className="text-[10px] text-brand-text/50 font-bold uppercase">sessions</span>
            </div>
            <span className="text-[10px] text-brand-text/60 block mt-0.5 font-medium">{totalWorkoutMinutes} mins active</span>
          </div>
        </div>

        {/* Media Card */}
        <div className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Media Log</span>
            <div className="p-2.5 bg-brand-cream rounded-xl text-brand-sage">
              <Film className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold font-display serif text-brand-sage">{totalMedia}</span>
              <span className="text-[10px] text-brand-text/50 font-bold uppercase">titles</span>
            </div>
            <span className="text-[10px] text-brand-text/60 block mt-0.5 font-medium">{completedMedia} completed</span>
          </div>
        </div>

        {/* Books Card */}
        <div className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Reading Stack</span>
            <div className="p-2.5 bg-brand-cream rounded-xl text-brand-sage">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold font-display serif text-brand-sage">{totalBooks}</span>
              <span className="text-[10px] text-brand-text/50 font-bold uppercase">books</span>
            </div>
            <span className="text-[10px] text-brand-text/60 block mt-0.5 font-medium">{readingBooks} actively reading</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Daily Snapshot */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[32px] border border-brand-border p-6 soft-shadow">
            <div className="flex items-center justify-between border-b border-brand-light-sand pb-4 mb-4">
              <h2 className="text-base font-bold serif text-brand-sage flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-olive" /> Daily Snapshot
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
              />
            </div>

            <p className="text-[11px] text-brand-text opacity-70 mb-6 font-medium">
              Select any date to see everything logged on that single day, perfectly aggregated from your Sheets tables.
            </p>

            <div className="space-y-5">
              {/* Diary Component for selectedDate */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl relative overflow-hidden border border-brand-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Diary</span>
                  {dayDiary ? (
                    <span className="text-[9px] px-2 py-0.5 font-bold bg-brand-cream text-brand-sage rounded-full uppercase tracking-wider border border-brand-border">Logged</span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 font-bold bg-[#edebe1] text-brand-text/50 rounded-full uppercase tracking-wider">Empty</span>
                  )}
                </div>

                {dayDiary ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${getMoodGradient(dayDiary.mood)}`}>
                        {getMoodEmoji(dayDiary.mood)}
                      </div>
                    </div>
                    {dayDiary.summary && (
                      <p className="text-xs text-brand-text italic leading-relaxed">
                        &ldquo;{dayDiary.summary}&rdquo;
                      </p>
                    )}
                    {dayDiary.gratitude && (
                      <div className="pt-2.5 border-t border-brand-border flex items-start gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-brand-sage flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] text-brand-text opacity-80 italic">Gratitude: {dayDiary.gratitude}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-brand-text/50 mb-2">No daily thoughts logged for this day.</p>
                    <button
                      onClick={() => onQuickLogDiary(selectedDate)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-sage hover:text-brand-dark cursor-pointer hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Journal this Day
                    </button>
                  </div>
                )}
              </div>

              {/* Workouts Component for selectedDate */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Fitness Log</span>
                  <span className="text-xs font-bold text-brand-text opacity-70">
                    {dayWorkouts.length > 0 ? `${dayWorkouts.length} Session(s)` : 'None'}
                  </span>
                </div>

                {dayWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {dayWorkouts.map((workout, index) => (
                      <div key={workout.id || index} className="p-3 bg-white border border-brand-border rounded-xl soft-shadow">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-brand-sage">{workout.type}</span>
                          <span className="px-1.5 py-0.5 bg-brand-cream text-brand-sage text-[10px] font-bold rounded-lg border border-brand-border">
                            {workout.intensity}
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-text opacity-70 font-medium flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-brand-olive" /> {workout.durationMinutes} minutes
                        </p>
                        {workout.notes && (
                          <p className="text-[11px] text-brand-text opacity-80 border-t border-brand-border pt-1.5 mt-1.5 font-medium italic">
                            {workout.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-brand-text/50 mb-2">No workouts logged for this day.</p>
                    <button
                      onClick={() => onNavigateToTab('workouts')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-sage hover:text-brand-dark cursor-pointer hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Log Workout
                    </button>
                  </div>
                )}
              </div>

              {/* Media Component for selectedDate */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Media Watched</span>
                  <span className="text-xs font-bold text-brand-text opacity-70">
                    {dayMedia.length > 0 ? `${dayMedia.length} Title(s)` : 'None'}
                  </span>
                </div>

                {dayMedia.length > 0 ? (
                  <div className="space-y-3">
                    {dayMedia.map((mediaItem, index) => (
                      <div key={mediaItem.id || index} className="p-3 bg-white border border-brand-border rounded-xl soft-shadow">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-brand-sage">{mediaItem.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-brand-cream text-brand-sage font-bold rounded-lg border border-brand-border uppercase tracking-wide">
                            {mediaItem.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-brand-text opacity-70">
                          <span className="text-amber-600">{'★'.repeat(mediaItem.rating)}{'☆'.repeat(5 - mediaItem.rating)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-olive">{mediaItem.status}</span>
                        </div>
                        {mediaItem.review && (
                          <p className="text-[11px] text-brand-text italic mt-2 border-t border-brand-border pt-2 leading-relaxed">
                            &ldquo;{mediaItem.review}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-brand-text/50 mb-2">No movies or TV shows logged for this day.</p>
                    <button
                      onClick={() => onNavigateToTab('media')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-sage hover:text-brand-dark cursor-pointer hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Log Movie/Show
                    </button>
                  </div>
                )}
              </div>

              {/* Books Component for selectedDate */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Book Updates</span>
                  <span className="text-xs font-bold text-brand-text opacity-70">
                    {dayBooks.length > 0 ? `${dayBooks.length} Update(s)` : 'None'}
                  </span>
                </div>

                {dayBooks.length > 0 ? (
                  <div className="space-y-3">
                    {dayBooks.map((book, index) => (
                      <div key={book.id || index} className="p-3 bg-white border border-brand-border rounded-xl soft-shadow">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-brand-sage">{book.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-brand-cream text-brand-sage font-bold rounded-lg border border-brand-border uppercase tracking-wide">
                            {book.format}
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-text opacity-60 mb-2 font-medium">by {book.author}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-brand-text opacity-70 uppercase tracking-wider">
                            <span>Progress</span>
                            <span>{book.progress}%</span>
                          </div>
                          <div className="w-full bg-brand-cream h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-sage h-full" style={{ width: `${book.progress}%` }}></div>
                          </div>
                        </div>
                        {book.keyTakeaways && (
                          <p className="text-[11px] text-brand-text opacity-80 italic mt-2.5 pt-2 border-t border-brand-border leading-relaxed">
                            Takeaway: {book.keyTakeaways}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-brand-text/50 mb-2">No book progress logged for this day.</p>
                    <button
                      onClick={() => onNavigateToTab('books')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-sage hover:text-brand-dark cursor-pointer hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Log Book Status
                    </button>
                  </div>
                )}
              </div>

              {/* Habits Component for selectedDate */}
              <div className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">Habits Checklist</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    dayHabit 
                      ? 'bg-brand-cream text-brand-sage border border-brand-border' 
                      : 'bg-[#edebe1] text-brand-text/50'
                  }`}>
                    {dayHabit ? 'Logged' : 'Empty'}
                  </span>
                </div>

                {dayHabit ? (
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-xl border border-brand-border text-brand-sage flex flex-col justify-center">
                        <span className="text-[9px] opacity-60 uppercase">Sleep</span>
                        <span className="text-sm font-bold text-brand-sage">{dayHabit.sleepHours} hrs</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-brand-border text-brand-sage flex flex-col justify-center">
                        <span className="text-[9px] opacity-60 uppercase">Water</span>
                        <span className="text-sm font-bold text-brand-sage">{dayHabit.waterLiters} L</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-xl border border-brand-border text-brand-sage flex flex-col justify-center">
                        <span className="text-[9px] opacity-60 uppercase">Meditation</span>
                        <span className="text-sm font-bold text-brand-sage">{dayHabit.meditation ? '✓ Yes' : '✗ No'}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-brand-border text-brand-sage flex flex-col justify-center">
                        <span className="text-[9px] opacity-60 uppercase">Mindful Eating</span>
                        <span className="text-sm font-bold text-brand-sage">{dayHabit.mindfulEating ? '✓ Yes' : '✗ No'}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-brand-border text-brand-sage flex flex-col justify-center">
                      <span className="text-[9px] opacity-60 uppercase">Screen Time</span>
                      <span className="text-sm font-bold text-brand-sage">{dayHabit.screenTimeMins} mins</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-brand-text/50 mb-2">No habits logged for this day.</p>
                    <button
                      onClick={() => onNavigateToTab('habits')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-sage hover:text-brand-dark cursor-pointer hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Log Habits
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Chronological Combined Life Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[32px] border border-brand-border p-6 soft-shadow">
            <h2 className="text-base font-bold serif text-brand-sage flex items-center gap-2 mb-2 font-display">
              <TrendingUp className="h-5 w-5 text-brand-olive" /> Life Timeline
            </h2>
            <p className="text-[11px] text-brand-text opacity-70 mb-6 font-medium">
              A combined real-time chronological stream of all your memories, physical efforts, watch sessions, and reading updates.
            </p>

            {recentFeed.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-brand-gray-border rounded-2xl">
                <Calendar className="mx-auto h-12 w-12 text-brand-olive opacity-40 mb-3" />
                <h3 className="text-sm font-semibold text-brand-sage">Timeline is empty</h3>
                <p className="text-xs text-brand-text opacity-50 mt-1 max-w-sm mx-auto">
                  Start logging your journal, workouts, media, and books to populate your Life Timeline dashboard!
                </p>
              </div>
            ) : (
              <div className="relative border-l border-brand-light-sand pl-4 ml-2 space-y-8">
                {recentFeed.map((item, index) => {
                  const itemColorMap = {
                    diary: 'bg-brand-sage text-white',
                    workout: 'bg-brand-olive text-white',
                    media: 'bg-[#edebe1] text-brand-sage border border-brand-gray-border/40',
                    book: 'bg-[#ece9df] text-brand-sage border border-brand-gray-border/60',
                    habit: 'bg-brand-cream text-brand-sage border border-brand-gray-border/50'
                  };

                  const itemIconMap = {
                    diary: <Smile className="h-3.5 w-3.5" />,
                    workout: <Dumbbell className="h-3.5 w-3.5" />,
                    media: <Film className="h-3.5 w-3.5" />,
                    book: <BookOpen className="h-3.5 w-3.5" />,
                    habit: <CheckSquare className="h-3.5 w-3.5" />
                  };

                  return (
                    <motion.div 
                      key={index} 
                      className="relative"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Left Dot/Icon */}
                      <span className={`absolute -left-[25px] top-1 flex h-5 w-5 items-center justify-center rounded-full ${itemColorMap[item.type]} ring-4 ring-white shadow-sm`}>
                        {itemIconMap[item.type]}
                      </span>

                      {/* Content Card */}
                      <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-border hover:bg-white hover:soft-shadow transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-bold text-brand-text opacity-50 font-mono tracking-wider">
                            {item.date}
                          </span>
                          <span className="text-[10px] font-bold text-brand-olive uppercase tracking-wider">
                            {item.type} log
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-brand-sage serif">
                          {item.title}
                        </h3>
                        <p className="text-xs font-semibold text-brand-text opacity-75 mt-0.5">
                          {item.subtitle}
                        </p>
                        {item.detail && (
                          <p className="text-xs text-brand-text opacity-90 mt-2 bg-white border border-brand-border/40 p-3 rounded-xl italic leading-relaxed font-sans">
                            &ldquo;{item.detail}&rdquo;
                          </p>
                        )}
                        {item.extra && (
                          <p className="text-[11px] text-brand-text opacity-70 mt-2.5 flex items-center gap-1.5 italic font-medium">
                            <Heart className="h-3 w-3 text-brand-sage flex-shrink-0" /> {item.extra}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

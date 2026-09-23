import { useState, useMemo } from 'react';
import { LifeOSData } from '../types';
import { 
  Dumbbell, 
  Flame, 
  Clock, 
  Moon, 
  Droplets, 
  Brain, 
  Utensils, 
  Monitor, 
  BookOpen, 
  Film, 
  Smile, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  Sparkles,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { getMountainDateString } from '../lib/dateUtils';

interface AnalyticsTabProps {
  data: LifeOSData;
  onNavigateToTab: (tabId: string) => void;
}

type TimeframeOption = '7d' | '30d' | '90d' | 'all';

// Custom Chart Palette aligned with the organic sage/olive/cream brand aesthetic
const PALETTE = {
  sage: '#6b705c',
  olive: '#a5a58d',
  sand: '#edebe1',
  cream: '#efebe0',
  dark: '#353b31',
  terracotta: '#b07d62',
  ochre: '#d4a373',
  slate: '#7f8c8d',
  green: '#588157'
};

const PIE_COLORS = [
  '#6b705c', // sage
  '#a5a58d', // olive
  '#d4a373', // ochre
  '#b07d62', // terracotta
  '#588157', // forest
  '#7f8c8d', // slate
  '#353b31'  // dark
];

export default function AnalyticsTab({ data, onNavigateToTab }: AnalyticsTabProps) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30d');

  const todayStr = useMemo(() => getMountainDateString(), []);

  // Compute cutoff date string (YYYY-MM-DD) based on timeframe
  const cutoffDateStr = useMemo(() => {
    if (timeframe === 'all') return null;
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return getMountainDateString(cutoff);
  }, [timeframe]);

  // Filter datasets
  const filteredWorkouts = useMemo(() => {
    if (!cutoffDateStr) return data.workouts;
    return data.workouts.filter(w => w.date >= cutoffDateStr);
  }, [data.workouts, cutoffDateStr]);

  const filteredHabits = useMemo(() => {
    if (!cutoffDateStr) return data.habits || [];
    return (data.habits || []).filter(h => h.date >= cutoffDateStr);
  }, [data.habits, cutoffDateStr]);

  const filteredMedia = useMemo(() => {
    if (!cutoffDateStr) return data.media;
    return data.media.filter(m => m.dateWatched >= cutoffDateStr);
  }, [data.media, cutoffDateStr]);

  const filteredDiary = useMemo(() => {
    if (!cutoffDateStr) return data.diary;
    return data.diary.filter(d => d.date >= cutoffDateStr);
  }, [data.diary, cutoffDateStr]);

  // Books: all active + finished in window
  const filteredBooks = useMemo(() => {
    if (!cutoffDateStr) return data.books;
    return data.books.filter(b => 
      b.status === 'Reading' || 
      (b.dateFinished && b.dateFinished >= cutoffDateStr) ||
      (b.dateLogged && b.dateLogged >= cutoffDateStr)
    );
  }, [data.books, cutoffDateStr]);

  // -------------------------------------------------------------
  // CUSTOM GOAL: DAILY LOGGING CONSISTENCY & STREAKS
  // -------------------------------------------------------------
  const { currentStreak, consistencyScore, todayLogs } = useMemo(() => {
    // Collect all unique active dates
    const loggedDatesSet = new Set<string>();
    data.diary.forEach(d => loggedDatesSet.add(d.date));
    data.workouts.forEach(w => loggedDatesSet.add(w.date));
    (data.habits || []).forEach(h => loggedDatesSet.add(h.date));
    data.media.forEach(m => loggedDatesSet.add(m.dateWatched));
    data.books.forEach(b => {
      if (b.dateLogged) loggedDatesSet.add(b.dateLogged);
      if (b.dateFinished) loggedDatesSet.add(b.dateFinished);
    });

    // Check today's specific logs
    const todayLogs = {
      workout: data.workouts.some(w => w.date === todayStr),
      habits: (data.habits || []).some(h => h.date === todayStr),
      diary: data.diary.some(d => d.date === todayStr),
      mediaOrBook: data.media.some(m => m.dateWatched === todayStr) || data.books.some(b => b.dateLogged === todayStr || b.dateFinished === todayStr)
    };

    // Calculate current streak backward from today
    let streak = 0;
    const testDate = new Date();
    // If today has not been logged yet, allow streak to continue from yesterday
    let checkDateStr = getMountainDateString(testDate);
    if (!loggedDatesSet.has(checkDateStr)) {
      testDate.setDate(testDate.getDate() - 1);
      checkDateStr = getMountainDateString(testDate);
    }

    while (loggedDatesSet.has(checkDateStr)) {
      streak++;
      testDate.setDate(testDate.getDate() - 1);
      checkDateStr = getMountainDateString(testDate);
    }

    // Consistency score within current timeframe
    const totalDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : Math.max(loggedDatesSet.size, 1);
    let daysWithLogsInRange = 0;
    
    if (cutoffDateStr) {
      loggedDatesSet.forEach(d => {
        if (d >= cutoffDateStr && d <= todayStr) daysWithLogsInRange++;
      });
    } else {
      daysWithLogsInRange = loggedDatesSet.size;
    }

    const consistencyScore = Math.min(100, Math.round((daysWithLogsInRange / totalDays) * 100));

    return {
      currentStreak: streak,
      consistencyScore,
      todayLogs
    };
  }, [data, todayStr, cutoffDateStr, timeframe]);

  // -------------------------------------------------------------
  // 1. FITNESS METRICS & CHARTS
  // -------------------------------------------------------------
  const totalWorkoutMinutes = useMemo(() => 
    filteredWorkouts.reduce((sum, w) => sum + (Number(w.duration) || 0), 0),
    [filteredWorkouts]
  );

  const totalCaloriesBurned = useMemo(() => 
    filteredWorkouts.reduce((sum, w) => sum + (Number(w.calories) || 0), 0),
    [filteredWorkouts]
  );

  const avgWorkoutDuration = useMemo(() => 
    filteredWorkouts.length > 0 ? Math.round(totalWorkoutMinutes / filteredWorkouts.length) : 0,
    [filteredWorkouts, totalWorkoutMinutes]
  );

  // Group workout volume by date (chronological)
  const workoutVolumeTimeline = useMemo(() => {
    const map = new Map<string, { date: string; minutes: number; workoutsCount: number }>();
    filteredWorkouts.forEach(w => {
      const existing = map.get(w.date) || { date: w.date, minutes: 0, workoutsCount: 0 };
      existing.minutes += Number(w.duration) || 0;
      existing.workoutsCount += 1;
      map.set(w.date, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredWorkouts]);

  // Workout Types Distribution
  const workoutTypesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredWorkouts.forEach(w => {
      const type = (w.type || 'Other').trim();
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredWorkouts]);

  // Energy Level split
  const energySplit = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    filteredWorkouts.forEach(w => {
      if (w.energy === 'High') counts.High++;
      else if (w.energy === 'Low') counts.Low++;
      else counts.Medium++;
    });
    return counts;
  }, [filteredWorkouts]);

  // -------------------------------------------------------------
  // 2. HABITS & WELLNESS METRICS & CHARTS
  // -------------------------------------------------------------
  const habitsSummary = useMemo(() => {
    const count = filteredHabits.length;
    if (count === 0) {
      return { avgSleep: 0, avgWater: 0, avgScreen: 0, meditationRate: 0, mindfulEatingRate: 0 };
    }
    const totalSleep = filteredHabits.reduce((acc, h) => acc + (Number(h.sleepHours) || 0), 0);
    const totalWater = filteredHabits.reduce((acc, h) => acc + (Number(h.waterLiters) || 0), 0);
    const totalScreen = filteredHabits.reduce((acc, h) => acc + (Number(h.screenTimeMins) || 0), 0);
    const meditationHits = filteredHabits.filter(h => h.meditation).length;
    const mindfulHits = filteredHabits.filter(h => h.mindfulEating).length;

    return {
      avgSleep: Number((totalSleep / count).toFixed(1)),
      avgWater: Number((totalWater / count).toFixed(1)),
      avgScreen: Math.round(totalScreen / count),
      meditationRate: Math.round((meditationHits / count) * 100),
      mindfulEatingRate: Math.round((mindfulHits / count) * 100)
    };
  }, [filteredHabits]);

  // Sleep vs Screen Time Timeline
  const sleepVsScreenTimeline = useMemo(() => {
    return [...filteredHabits]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(h => ({
        date: h.date.slice(5), // MM-DD for compact axis
        fullDate: h.date,
        sleepHours: Number(h.sleepHours) || 0,
        screenTimeMins: Number(h.screenTimeMins) || 0,
        waterLiters: Number(h.waterLiters) || 0
      }));
  }, [filteredHabits]);

  // -------------------------------------------------------------
  // 3. READING & MEDIA METRICS & CHARTS
  // -------------------------------------------------------------
  const readingStats = useMemo(() => {
    const completed = data.books.filter(b => b.status === 'Completed').length;
    const reading = data.books.filter(b => b.status === 'Reading');
    const wantToRead = data.books.filter(b => b.status === 'To Read').length;
    return { completed, reading, wantToRead };
  }, [data.books]);

  const mediaStats = useMemo(() => {
    const total = filteredMedia.length;
    const movies = filteredMedia.filter(m => m.type === 'Movie').length;
    const series = filteredMedia.filter(m => m.type === 'Series').length;
    const avgRating = total > 0
      ? (filteredMedia.reduce((acc, m) => acc + (Number(m.rating) || 0), 0) / total).toFixed(1)
      : '0.0';

    // Genre count
    const genreMap: Record<string, number> = {};
    filteredMedia.forEach(m => {
      const g = (m.genre || 'Other').trim();
      genreMap[g] = (genreMap[g] || 0) + 1;
    });
    const topGenres = Object.entries(genreMap)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total, movies, series, avgRating, topGenres };
  }, [filteredMedia]);

  // -------------------------------------------------------------
  // 4. MOOD & REFLECTION METRICS & CHARTS
  // -------------------------------------------------------------
  const moodScoreMap: Record<string, number> = {
    'Great': 5,
    'Good': 4,
    'Neutral': 3,
    'Low': 2,
    'Bad': 1
  };

  const moodTrajectory = useMemo(() => {
    return [...filteredDiary]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: d.date.slice(5),
        fullDate: d.date,
        mood: d.mood,
        score: moodScoreMap[d.mood] || 3
      }));
  }, [filteredDiary]);

  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = { 'Great': 0, 'Good': 0, 'Neutral': 0, 'Low': 0, 'Bad': 0 };
    filteredDiary.forEach(d => {
      if (counts[d.mood] !== undefined) counts[d.mood]++;
      else counts['Neutral']++;
    });
    return [
      { name: 'Great', value: counts['Great'], color: '#588157' },
      { name: 'Good', value: counts['Good'], color: '#6b705c' },
      { name: 'Neutral', value: counts['Neutral'], color: '#a5a58d' },
      { name: 'Low', value: counts['Low'], color: '#d4a373' },
      { name: 'Bad', value: counts['Bad'], color: '#b07d62' }
    ].filter(item => item.value > 0);
  }, [filteredDiary]);

  return (
    <div className="space-y-10 font-sans pb-16">
      {/* Header & Controls */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-light-sand pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="sans text-[10px] opacity-60 uppercase tracking-widest font-bold font-mono">
              Intelligence & Insights
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-cream text-brand-sage text-[9px] font-bold">
              <Sparkles className="h-3 w-3" /> Live Analysis
            </span>
          </div>
          <h2 className="serif text-3xl font-bold text-brand-sage tracking-tight">
            Analytics & Trends
          </h2>
          <p className="text-xs text-brand-text/70 mt-1 max-w-xl">
            Visual metrics synthesized from your Google Sheets records across fitness, wellness, reading, and mental clarity.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-brand-border soft-shadow self-start">
          {(
            [
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                timeframe === tab.id
                  ? 'bg-brand-sage text-white shadow-sm'
                  : 'text-brand-text/60 hover:text-brand-text hover:bg-brand-sand/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOM GOAL: DAILY LOGGING CONSISTENCY TRACKER */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white rounded-[32px] border border-brand-border p-6 soft-shadow relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-cream rounded-lg text-brand-sage">
                <Award className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sage">
                Primary Goal: Daily Consistency
              </span>
            </div>
            <h3 className="serif text-xl font-bold text-brand-sage">
              Keep the Daily Habit Loop Alive
            </h3>
            <p className="text-xs text-brand-text/70 leading-relaxed">
              Recording your day takes less than 2 minutes and unlocks accurate personal trajectory over months.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0">
            <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border">
              <span className="text-[10px] uppercase tracking-wider text-brand-text/60 font-bold block">
                Current Streak
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="serif text-3xl font-bold text-brand-sage">{currentStreak}</span>
                <span className="text-xs text-brand-olive font-bold">days</span>
              </div>
              <span className="text-[10px] text-brand-text/50 mt-1 block">Consecutive logs</span>
            </div>

            <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border">
              <span className="text-[10px] uppercase tracking-wider text-brand-text/60 font-bold block">
                Consistency
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="serif text-3xl font-bold text-brand-sage">{consistencyScore}%</span>
              </div>
              <span className="text-[10px] text-brand-text/50 mt-1 block">In selected window</span>
            </div>

            <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-brand-text/60 font-bold block">
                Today's Check
              </span>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span
                  title="Workout Logged"
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    todayLogs.workout ? 'bg-brand-cream text-brand-sage' : 'bg-brand-sand/50 text-brand-text/30'
                  }`}
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                </span>
                <span
                  title="Habits Logged"
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    todayLogs.habits ? 'bg-brand-cream text-brand-sage' : 'bg-brand-sand/50 text-brand-text/30'
                  }`}
                >
                  <Droplets className="h-3.5 w-3.5" />
                </span>
                <span
                  title="Journal Logged"
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    todayLogs.diary ? 'bg-brand-cream text-brand-sage' : 'bg-brand-sand/50 text-brand-text/30'
                  }`}
                >
                  <Smile className="h-3.5 w-3.5" />
                </span>
                <span
                  title="Reading/Media Logged"
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    todayLogs.mediaOrBook ? 'bg-brand-cream text-brand-sage' : 'bg-brand-sand/50 text-brand-text/30'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
              </div>
              <span className="text-[10px] text-brand-text/50 mt-1.5 block">
                {todayLogs.workout && todayLogs.habits && todayLogs.diary ? 'Completed for today' : 'Logs in progress'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 1. FITNESS (RANK #1 - HIGHEST PRIORITY) */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-olive font-mono">
                Priority 1
              </span>
              <h3 className="serif text-xl font-bold text-brand-sage">Fitness & Physical Activity</h3>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('workouts')}
            className="text-xs font-bold text-brand-sage hover:underline cursor-pointer"
          >
            Log Workout &rarr;
          </button>
        </div>

        {/* Fitness Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Total Workouts
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display serif text-brand-sage">
                {filteredWorkouts.length}
              </span>
              <span className="text-[11px] text-brand-text/50">sessions</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Total Exercise Time
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display serif text-brand-sage">
                {totalWorkoutMinutes}
              </span>
              <span className="text-[11px] text-brand-text/50">mins</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Est. Calories Burned
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display serif text-brand-sage">
                {totalCaloriesBurned > 0 ? totalCaloriesBurned.toLocaleString() : 'N/A'}
              </span>
              <span className="text-[11px] text-brand-text/50">kcal</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Avg Session Length
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display serif text-brand-sage">
                {avgWorkoutDuration}
              </span>
              <span className="text-[11px] text-brand-text/50">mins</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workout Volume Timeline */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[28px] border border-brand-border soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="serif font-bold text-base text-brand-sage">Workout Duration by Date</h4>
                <p className="text-[11px] text-brand-text/60 mt-0.5">Active minutes logged per day</p>
              </div>
              <span className="text-[10px] font-mono text-brand-olive font-bold">Minutes (m)</span>
            </div>

            {workoutVolumeTimeline.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-brand-text/50 border border-dashed border-brand-border rounded-xl">
                <Dumbbell className="h-8 w-8 text-brand-olive/40 mb-2" />
                <p className="text-xs">No workout records in this timeframe.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutVolumeTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#f0ede4' }}
                      tickFormatter={d => d.slice(5)}
                    />
                    <YAxis 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#f0ede4' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#f0ede4',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                      formatter={(val: any) => [`${val} minutes`, 'Duration']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar dataKey="minutes" fill={PALETTE.sage} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Workout Type Distribution */}
          <div className="bg-white p-6 rounded-[28px] border border-brand-border soft-shadow flex flex-col justify-between">
            <div>
              <h4 className="serif font-bold text-base text-brand-sage">Workout Types</h4>
              <p className="text-[11px] text-brand-text/60 mt-0.5">Training diversity</p>
            </div>

            {workoutTypesData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-brand-text/50">
                No workouts logged
              </div>
            ) : (
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workoutTypesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {workoutTypesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#f0ede4',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend / Breakdown list */}
            <div className="space-y-1.5 pt-2 border-t border-brand-light-sand">
              {workoutTypesData.slice(0, 4).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                    />
                    <span className="font-semibold text-brand-text/80">{item.name}</span>
                  </div>
                  <span className="font-bold text-brand-sage">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. HABITS & WELLNESS (RANK #2) */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-olive font-mono">
                Priority 2
              </span>
              <h3 className="serif text-xl font-bold text-brand-sage">Habits & Daily Wellness</h3>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('habits')}
            className="text-xs font-bold text-brand-sage hover:underline cursor-pointer"
          >
            Log Habits &rarr;
          </button>
        </div>

        {/* Wellness Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Avg Sleep
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-display serif text-brand-sage">
                {habitsSummary.avgSleep}
              </span>
              <span className="text-[11px] text-brand-text/50">hrs</span>
            </div>
            <span className="text-[10px] text-brand-text/40 block mt-1">Goal: 7.5+ hrs</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Avg Water
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-display serif text-brand-sage">
                {habitsSummary.avgWater}
              </span>
              <span className="text-[11px] text-brand-text/50">L</span>
            </div>
            <span className="text-[10px] text-brand-text/40 block mt-1">Goal: 2.0+ L</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Meditation
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-display serif text-brand-sage">
                {habitsSummary.meditationRate}%
              </span>
            </div>
            <span className="text-[10px] text-brand-text/40 block mt-1">Adherence</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Mindful Eating
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-display serif text-brand-sage">
                {habitsSummary.mindfulEatingRate}%
              </span>
            </div>
            <span className="text-[10px] text-brand-text/40 block mt-1">Adherence</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border soft-shadow col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-brand-text opacity-50 uppercase tracking-wider">
              Avg Screen Time
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-display serif text-brand-sage">
                {habitsSummary.avgScreen}
              </span>
              <span className="text-[11px] text-brand-text/50">mins</span>
            </div>
            <span className="text-[10px] text-brand-text/40 block mt-1">Daily average</span>
          </div>
        </div>

        {/* Charts: Sleep vs Screen Time + Water Intake */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dual Axis: Sleep vs Screen Time */}
          <div className="bg-white p-6 rounded-[28px] border border-brand-border soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="serif font-bold text-base text-brand-sage">Sleep vs. Screen Time</h4>
                <p className="text-[11px] text-brand-text/60 mt-0.5">Explore how daily screen exposure affects your sleep</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-brand-sage">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-sage inline-block" /> Sleep (hrs)
                </span>
                <span className="flex items-center gap-1 text-[#d4a373]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373] inline-block" /> Screen (mins)
                </span>
              </div>
            </div>

            {sleepVsScreenTimeline.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-brand-text/50 border border-dashed border-brand-border rounded-xl">
                <Moon className="h-8 w-8 text-brand-olive/40 mb-2" />
                <p className="text-xs">No habits records in this timeframe.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sleepVsScreenTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }}
                      domain={[0, 'auto']}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fill: '#d4a373', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#f0ede4',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    />
                    <Bar yAxisId="left" dataKey="sleepHours" fill={PALETTE.sage} radius={[4, 4, 0, 0]} name="Sleep (Hours)" />
                    <Line yAxisId="right" type="monotone" dataKey="screenTimeMins" stroke="#d4a373" strokeWidth={2.5} dot={{ r: 3 }} name="Screen Time (Mins)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Daily Water Intake with Reference Line */}
          <div className="bg-white p-6 rounded-[28px] border border-brand-border soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="serif font-bold text-base text-brand-sage">Hydration Consistency</h4>
                <p className="text-[11px] text-brand-text/60 mt-0.5">Daily water intake vs. 2.0L baseline target</p>
              </div>
              <span className="text-[10px] font-mono text-brand-olive font-bold">Liters (L)</span>
            </div>

            {sleepVsScreenTimeline.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-brand-text/50 border border-dashed border-brand-border rounded-xl">
                <Droplets className="h-8 w-8 text-brand-olive/40 mb-2" />
                <p className="text-xs">No hydration records in this timeframe.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepVsScreenTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }} 
                    />
                    <YAxis 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }}
                      domain={[0, 4]} 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#f0ede4',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                      formatter={(val: any) => [`${val} Liters`, 'Water']}
                    />
                    <ReferenceLine y={2.0} stroke="#b07d62" strokeDasharray="3 3" label={{ value: '2.0L Target', fill: '#b07d62', fontSize: 10, position: 'top' }} />
                    <Bar dataKey="waterLiters" fill="#a5a58d" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. READING & MEDIA (RANK #3) */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-olive font-mono">
                Priority 3
              </span>
              <h3 className="serif text-xl font-bold text-brand-sage">Reading & Entertainment</h3>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigateToTab('books')}
              className="text-xs font-bold text-brand-sage hover:underline cursor-pointer"
            >
              Books &rarr;
            </button>
            <span className="text-brand-text/30">•</span>
            <button
              onClick={() => onNavigateToTab('media')}
              className="text-xs font-bold text-brand-sage hover:underline cursor-pointer"
            >
              Movies & TV &rarr;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Books Status & Active Progress */}
          <div className="bg-white p-6 rounded-[28px] border border-brand-border soft-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="serif font-bold text-base text-brand-sage">Books Status & Reading Velocity</h4>
                  <p className="text-[11px] text-brand-text/60 mt-0.5">Tracking reading milestones</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-brand-cream text-brand-sage">
                    {readingStats.completed} Finished
                  </span>
                </div>
              </div>

              {/* Active Book Progress Bars */}
              <div className="space-y-3.5 my-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50">
                  Currently Reading ({readingStats.reading.length})
                </span>

                {readingStats.reading.length === 0 ? (
                  <p className="text-xs text-brand-text/50 italic py-2">
                    No books currently in progress. Add a title in the Books tab!
                  </p>
                ) : (
                  readingStats.reading.map(book => (
                    <div key={book.id || book.title} className="p-3 bg-brand-bg rounded-xl border border-brand-border/60">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-brand-sage truncate max-w-[200px]">{book.title}</span>
                        <span className="text-brand-olive font-bold">{book.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-brand-sand rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-sage rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(0, book.progress))}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-brand-text/50 mt-1 block">by {book.author || 'Unknown'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-brand-light-sand flex items-center justify-between text-xs">
              <span className="text-brand-text/60 font-medium">To-read wishlist: <b>{readingStats.wantToRead}</b></span>
              <button 
                onClick={() => onNavigateToTab('books')}
                className="font-bold text-brand-sage hover:underline cursor-pointer"
              >
                Manage Library &rarr;
              </button>
            </div>
          </div>

          {/* Media Consumption & Ratings */}
          <div className="bg-white p-6 rounded-[28px] border border-brand-border soft-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="serif font-bold text-base text-brand-sage">Screen & Story Entertainment</h4>
                  <p className="text-[11px] text-brand-text/60 mt-0.5">Watched films and television series</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-sage">
                  <Film className="h-4 w-4" />
                  <span>{mediaStats.total} Logged</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border text-center">
                  <span className="text-[9px] uppercase font-bold text-brand-text/50 block">Movies</span>
                  <span className="serif text-xl font-bold text-brand-sage">{mediaStats.movies}</span>
                </div>
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border text-center">
                  <span className="text-[9px] uppercase font-bold text-brand-text/50 block">TV Shows</span>
                  <span className="serif text-xl font-bold text-brand-sage">{mediaStats.series}</span>
                </div>
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border text-center">
                  <span className="text-[9px] uppercase font-bold text-brand-text/50 block">Avg Rating</span>
                  <span className="serif text-xl font-bold text-brand-sage">★ {mediaStats.avgRating}</span>
                </div>
              </div>

              {/* Top Genres Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50">
                  Top Genres Explored
                </span>
                {mediaStats.topGenres.length === 0 ? (
                  <p className="text-xs text-brand-text/50 italic">No media entries logged yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {mediaStats.topGenres.map(g => (
                      <div key={g.genre} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-brand-text/80">{g.genre}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-brand-sand rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-olive rounded-full" 
                              style={{ width: `${(g.count / Math.max(mediaStats.total, 1)) * 100}%` }} 
                            />
                          </div>
                          <span className="font-bold text-brand-sage text-[10px] w-4 text-right">{g.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-brand-light-sand text-right">
              <button 
                onClick={() => onNavigateToTab('media')}
                className="text-xs font-bold text-brand-sage hover:underline cursor-pointer"
              >
                View Watchlist &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. MOOD & REFLECTION (RANK #4) */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-cream text-brand-sage rounded-xl">
              <Smile className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-olive font-mono">
                Priority 4
              </span>
              <h3 className="serif text-xl font-bold text-brand-sage">Mood Journey & Reflections</h3>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('diary')}
            className="text-xs font-bold text-brand-sage hover:underline cursor-pointer"
          >
            Open Journal &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Trajectory Area Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[28px] border border-brand-border soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="serif font-bold text-base text-brand-sage">Emotional Baseline Trajectory</h4>
                <p className="text-[11px] text-brand-text/60 mt-0.5">Rating scaled from Great (5) down to Bad (1)</p>
              </div>
              <span className="text-[10px] font-mono text-brand-olive font-bold">5-Point Mood Scale</span>
            </div>

            {moodTrajectory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-brand-text/50 border border-dashed border-brand-border rounded-xl">
                <Smile className="h-8 w-8 text-brand-olive/40 mb-2" />
                <p className="text-xs">No journal entries in this timeframe.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PALETTE.sage} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={PALETTE.sage} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }} 
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      ticks={[1, 2, 3, 4, 5]} 
                      tickFormatter={(v) => {
                        if (v === 5) return 'Great';
                        if (v === 4) return 'Good';
                        if (v === 3) return 'Neutral';
                        if (v === 2) return 'Low';
                        return 'Bad';
                      }}
                      tick={{ fill: '#7f8c8d', fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f0ede4' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#f0ede4',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                      formatter={(_, __, props: any) => [`${props.payload.mood}`, 'Mood']}
                      labelFormatter={l => `Date: ${l}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke={PALETTE.sage} 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#moodGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Mood Distribution */}
          <div className="bg-white p-6 rounded-[28px] border border-brand-border soft-shadow flex flex-col justify-between">
            <div>
              <h4 className="serif font-bold text-base text-brand-sage">Mood Distribution</h4>
              <p className="text-[11px] text-brand-text/60 mt-0.5">Sentiment frequency breakdown</p>
            </div>

            {moodDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-brand-text/50">
                No entries logged
              </div>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`mood-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#f0ede4',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-brand-light-sand">
              {moodDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-brand-text/80">{item.name}</span>
                  </div>
                  <span className="font-bold text-brand-sage">{item.value} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

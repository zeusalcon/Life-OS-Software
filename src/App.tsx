import { useState, useEffect } from 'react';
import { initAuth, logout } from './lib/auth';
import { 
  fetchLifeOSData, 
  addDiaryEntry, 
  updateDiaryEntry, 
  addWorkoutEntry, 
  updateWorkoutEntry, 
  addMediaEntry, 
  updateMediaEntry, 
  addBookEntry, 
  updateBookEntry, 
  addHabitEntry,
  updateHabitEntry,
  deleteRow,
  getOrCreateSpreadsheet,
  forceRemakeSpreadsheet
} from './lib/sheets';
import { LifeOSData, DiaryEntry, WorkoutEntry, MediaEntry, BookEntry, HabitEntry } from './types';
import Login from './components/Login';
import Overview from './components/Overview';
import DiaryTab from './components/DiaryTab';
import WorkoutsTab from './components/WorkoutsTab';
import MediaTab from './components/MediaTab';
import BooksTab from './components/BooksTab';
import HabitsTab from './components/HabitsTab';
import AnalyticsTab from './components/AnalyticsTab';
import DailyLogTab from './components/DailyLogTab';

import { 
  LayoutDashboard, 
  Smile, 
  Dumbbell, 
  Film, 
  BookOpen, 
  LogOut, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert,
  Database,
  CheckSquare,
  TrendingUp,
  ClipboardEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  // App Data State
  const [data, setData] = useState<LifeOSData>({
    diary: [],
    workouts: [],
    media: [],
    books: [],
    habits: []
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRemakingSpreadsheet, setIsRemakingSpreadsheet] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [prefilledDiaryDate, setPrefilledDiaryDate] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setUser(user);
        setToken(cachedToken);
        setNeedsAuth(false);
        setIsInitializingAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setIsInitializingAuth(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch data from Sheets whenever token changes
  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const loadAllData = async () => {
    if (!token) return;
    setIsLoadingData(true);
    setSyncStatus('syncing');
    try {
      // 1. Get spreadsheet ID (creating it if needed)
      const id = await getOrCreateSpreadsheet(token);
      setSpreadsheetId(id);

      // 2. Fetch all values
      const res = await fetchLifeOSData(token);
      setData(res);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('Error fetching data from Google Sheets:', err);
      setSyncStatus('error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoginSuccess = (signedInUser: any, accessToken: string) => {
    setUser(signedInUser);
    setToken(accessToken);
    setNeedsAuth(false);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to sign out?");
    if (!confirmLogout) return;

    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setData({ diary: [], workouts: [], media: [], books: [], habits: [] });
      setNeedsAuth(true);
      setActiveTab('overview');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleForceRemakeSpreadsheet = async () => {
    if (!token) return;
    const confirmRemake = window.confirm(
      "Are you sure you want to remake your Life OS Database spreadsheet? \n\n" +
      "This will safely rename your existing 'Life OS Database' sheet on Google Drive to a backup file " +
      "so you won't lose any data, and then initialize a brand new spreadsheet with fully updated tabs " +
      "(Diary, Workouts, Media, Books) and columns to support the new Interactive Workout Routine Tracker!"
    );
    if (!confirmRemake) return;

    setIsRemakingSpreadsheet(true);
    setSyncStatus('syncing');
    try {
      const newId = await forceRemakeSpreadsheet(token);
      setSpreadsheetId(newId);
      // Reload everything
      await loadAllData();
      alert("Successfully remade spreadsheet! A fresh 'Life OS Database' has been created, and your old database has been renamed as a safe backup.");
    } catch (err) {
      console.error("Error remaking spreadsheet:", err);
      alert("Failed to remake spreadsheet. Please check your network connection and try again.");
      setSyncStatus('error');
    } finally {
      setIsRemakingSpreadsheet(false);
    }
  };

  // Operation Handlers (Sync Back to Sheet & Refresh State)
  const wrapWithSync = async (operation: () => Promise<void>) => {
    setSyncStatus('syncing');
    try {
      await operation();
      // Reload all sheets data to maintain total accuracy
      await loadAllData();
    } catch (err) {
      console.error('Sync operation failed:', err);
      setSyncStatus('error');
      alert('Action completed locally, but failed to sync to Google Sheets. Please reload.');
      throw err;
    }
  };

  // Diary Helpers
  const handleAddDiary = async (entry: Omit<DiaryEntry, 'rowIndex'>) => {
    if (!token) return;
    await wrapWithSync(() => addDiaryEntry(token, entry));
  };

  const handleUpdateDiary = async (entry: DiaryEntry) => {
    if (!token) return;
    await wrapWithSync(() => updateDiaryEntry(token, entry));
  };

  const handleDeleteDiary = async (rowIndex: number) => {
    if (!token) return;
    await wrapWithSync(() => deleteRow(token, 'Diary', rowIndex));
  };

  // Workout Helpers
  const handleAddWorkout = async (entry: Omit<WorkoutEntry, 'rowIndex'>) => {
    if (!token) return;
    await wrapWithSync(() => addWorkoutEntry(token, entry));
  };

  const handleUpdateWorkout = async (entry: WorkoutEntry) => {
    if (!token) return;
    await wrapWithSync(() => updateWorkoutEntry(token, entry));
  };

  const handleDeleteWorkout = async (rowIndex: number) => {
    if (!token) return;
    await wrapWithSync(() => deleteRow(token, 'Workouts', rowIndex));
  };

  // Media Helpers
  const handleAddMedia = async (entry: Omit<MediaEntry, 'rowIndex'>) => {
    if (!token) return;
    await wrapWithSync(() => addMediaEntry(token, entry));
  };

  const handleUpdateMedia = async (entry: MediaEntry) => {
    if (!token) return;
    await wrapWithSync(() => updateMediaEntry(token, entry));
  };

  const handleDeleteMedia = async (rowIndex: number) => {
    if (!token) return;
    await wrapWithSync(() => deleteRow(token, 'Media', rowIndex));
  };

  // Book Helpers
  const handleAddBook = async (entry: Omit<BookEntry, 'rowIndex'>) => {
    if (!token) return;
    await wrapWithSync(() => addBookEntry(token, entry));
  };

  const handleUpdateBook = async (entry: BookEntry) => {
    if (!token) return;
    await wrapWithSync(() => updateBookEntry(token, entry));
  };

  const handleDeleteBook = async (rowIndex: number) => {
    if (!token) return;
    await wrapWithSync(() => deleteRow(token, 'Books', rowIndex));
  };

  // Habit Helpers
  const handleAddHabit = async (entry: Omit<HabitEntry, 'rowIndex'>) => {
    if (!token) return;
    await wrapWithSync(() => addHabitEntry(token, entry));
  };

  const handleUpdateHabit = async (entry: HabitEntry) => {
    if (!token) return;
    await wrapWithSync(() => updateHabitEntry(token, entry));
  };

  const handleDeleteHabit = async (rowIndex: number) => {
    if (!token) return;
    await wrapWithSync(() => deleteRow(token, 'Habits', rowIndex));
  };

  // Route to diary with date preset
  const handleQuickLogDiary = (date: string) => {
    setPrefilledDiaryDate(date);
    setActiveTab('diary');
  };

  // Render Loading Screen while checking auth on boot
  if (isInitializingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg text-brand-text font-sans">
        <Loader2 className="h-10 w-10 text-brand-sage animate-spin mb-4" />
        <h2 className="text-xs font-bold tracking-wider uppercase text-brand-olive">Loading Personal Life OS...</h2>
      </div>
    );
  }

  // Redirect to login if user is not authorized
  if (needsAuth || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'daily-log', label: 'Daily Form', icon: <ClipboardEdit className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'diary', label: 'Journal', icon: <Smile className="h-4 w-4" /> },
    { id: 'workouts', label: 'Workouts', icon: <Dumbbell className="h-4 w-4" /> },
    { id: 'media', label: 'Movies & TV', icon: <Film className="h-4 w-4" /> },
    { id: 'books', label: 'Books', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'habits', label: 'Habits', icon: <CheckSquare className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col lg:flex-row text-brand-text font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-brand-bg flex flex-col justify-between shrink-0 border-r border-brand-light-sand lg:sticky lg:top-0 lg:h-screen z-20 p-6">
        <div>
          {/* Brand Logo / Title */}
          <div className="mb-10 p-2">
            <h1 className="serif text-2xl font-bold text-brand-sage flex items-center gap-2">
              <span className="text-brand-olive">✦</span> Life OS
            </h1>
            <p className="sans text-[10px] opacity-60 uppercase tracking-widest mt-1 font-mono font-bold">
              Personal Dashboard
            </p>
          </div>

          {/* Navigation links */}
          <nav className="space-y-4 flex-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-1 py-1 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'text-brand-sage font-bold'
                      : 'text-brand-text opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    isActive ? 'bg-brand-sage scale-110' : 'bg-transparent'
                  }`} />
                  <span className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quotes & User Account Details */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-brand-border/60 rounded-2xl border border-brand-border/30">
            <p className="text-[10px] leading-relaxed opacity-70 italic font-medium">
              "The secret of your future is hidden in your daily routine."
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3 p-2 bg-brand-sand/20 rounded-xl border border-brand-border/40">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="h-9 w-9 rounded-full ring-2 ring-brand-olive/30" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-9 w-9 bg-brand-olive text-white font-bold rounded-full flex items-center justify-center text-xs">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-brand-text truncate">{user.displayName || 'Life OS User'}</p>
                <p className="text-[9px] text-brand-text/60 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Google spreadsheet direct integration links */}
          {spreadsheetId && (
            <div className="space-y-2 w-full">
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full px-3 py-2.5 bg-brand-cream hover:bg-brand-sand border border-brand-border rounded-xl text-[10px] font-bold text-brand-sage transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5 text-brand-sage" /> View Raw Spreadsheet
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={handleForceRemakeSpreadsheet}
                disabled={isRemakingSpreadsheet}
                className="flex items-center justify-between w-full px-3 py-2.5 bg-brand-bg hover:bg-brand-cream border border-brand-border rounded-xl text-[10px] font-bold text-brand-olive transition cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  {isRemakingSpreadsheet ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-olive" />
                  ) : (
                    <Database className="h-3.5 w-3.5 text-brand-olive" />
                  )}
                  <span>{isRemakingSpreadsheet ? 'Remaking Database...' : 'Remake Database Sheet'}</span>
                </span>
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-brand-text/70 font-semibold text-[10px] rounded-xl border border-brand-border transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Top Bar containing Realtime Sheet Sync Monitor */}
        <header className="h-14 bg-brand-bg border-b border-brand-light-sand flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-wider">
              {activeTab} Workspace
            </span>
          </div>

          {/* Realtime Sheets Database Sync Monitor */}
          <div className="flex items-center gap-1.5 text-xs">
            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-sand text-brand-sage font-bold rounded-lg animate-pulse border border-brand-border">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing with Google Sheets...
              </span>
            )}
            {syncStatus === 'success' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-brand-cream text-brand-sage font-bold rounded-lg border border-brand-border">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sheets Database Synced
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100">
                <ShieldAlert className="h-3.5 w-3.5" /> Sync Error
              </span>
            )}
            {syncStatus === 'idle' && (
              <button 
                onClick={loadAllData}
                disabled={isLoadingData}
                className="flex items-center gap-1 px-2.5 py-1 text-brand-sage hover:text-brand-dark hover:bg-brand-sand transition border border-brand-gray-border rounded-lg cursor-pointer"
              >
                Refresh Data
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-8 max-w-7xl w-full mx-auto">
          {isLoadingData && data.diary.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-brand-text/60">
              <Loader2 className="h-8 w-8 text-brand-sage animate-spin mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider">Establishing Connection to Sheets...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'overview' && (
                  <Overview 
                    data={data} 
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                    onQuickLogDiary={handleQuickLogDiary}
                  />
                )}
                {activeTab === 'daily-log' && (
                  <DailyLogTab
                    data={data}
                    onAddHabit={handleAddHabit}
                    onUpdateHabit={handleUpdateHabit}
                    onAddDiary={handleAddDiary}
                    onUpdateDiary={handleUpdateDiary}
                    onAddWorkout={handleAddWorkout}
                    onUpdateWorkout={handleUpdateWorkout}
                    onAddMedia={handleAddMedia}
                    onAddBook={handleAddBook}
                    onUpdateBook={handleUpdateBook}
                    onNavigateToTab={setActiveTab}
                  />
                )}
                {activeTab === 'diary' && (
                  <DiaryTab
                    entries={data.diary}
                    onAddEntry={handleAddDiary}
                    onUpdateEntry={handleUpdateDiary}
                    onDeleteEntry={handleDeleteDiary}
                    prefilledDate={prefilledDiaryDate}
                    clearPrefilledDate={() => setPrefilledDiaryDate(null)}
                  />
                )}
                {activeTab === 'workouts' && (
                  <WorkoutsTab
                    workouts={data.workouts}
                    onAddWorkout={handleAddWorkout}
                    onUpdateWorkout={handleUpdateWorkout}
                    onDeleteWorkout={handleDeleteWorkout}
                  />
                )}
                {activeTab === 'media' && (
                  <MediaTab
                    media={data.media}
                    onAddMedia={handleAddMedia}
                    onUpdateMedia={handleUpdateMedia}
                    onDeleteMedia={handleDeleteMedia}
                  />
                )}
                {activeTab === 'books' && (
                  <BooksTab
                    books={data.books}
                    onAddBook={handleAddBook}
                    onUpdateBook={handleUpdateBook}
                    onDeleteBook={handleDeleteBook}
                  />
                )}
                {activeTab === 'habits' && (
                  <HabitsTab
                    habits={data.habits || []}
                    onAddHabit={handleAddHabit}
                    onUpdateHabit={handleUpdateHabit}
                    onDeleteHabit={handleDeleteHabit}
                  />
                )}
                {activeTab === 'analytics' && (
                  <AnalyticsTab
                    data={data}
                    onNavigateToTab={setActiveTab}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

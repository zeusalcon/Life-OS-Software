export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  summary: string;
  gratitude: string;
  workoutLinked: string; // blank or ID of workout
  mediaLinked: string;   // blank or ID of media
  bookLinked: string;    // blank or ID of book
  rowIndex?: number;     // 1-based row index in Google Sheet
}

export interface WorkoutEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: string; // Weights, Cardio, Yoga, Sports, Walk/Run, Other
  day?: string;  // e.g. Day A, Day B, Day C
  durationMinutes: number;
  intensity: 'Low' | 'Medium' | 'High';
  notes: string;
  rowIndex?: number;
}

export interface MediaEntry {
  id: string;
  dateWatched: string; // YYYY-MM-DD
  title: string;
  type: 'Movie' | 'TV Show';
  rating: number; // 1-5
  status: 'To Watch' | 'Watching' | 'Completed';
  review: string;
  rowIndex?: number;
}

export interface BookEntry {
  id: string;
  dateLogged: string; // YYYY-MM-DD
  title: string;
  author: string;
  format: 'Audiobook' | 'Kindle' | 'Physical' | 'E-book';
  progress: number; // 0-100
  status: 'To Read' | 'Reading' | 'Completed';
  keyTakeaways: string;
  dateFinished: string; // YYYY-MM-DD or blank
  rowIndex?: number;
}

export interface HabitEntry {
  date: string; // YYYY-MM-DD
  sleepHours: number;
  waterLiters: number;
  meditation: boolean;
  mindfulEating: boolean;
  screenTimeMins: number;
  rowIndex?: number;
}

export interface LifeOSData {
  diary: DiaryEntry[];
  workouts: WorkoutEntry[];
  media: MediaEntry[];
  books: BookEntry[];
  habits: HabitEntry[];
}

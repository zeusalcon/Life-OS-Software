import { useState } from 'react';
import { googleSignIn } from '../lib/auth';
import { ShieldCheck, Database, CalendarDays, FileSpreadsheet } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onLoginSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-[32px] soft-shadow border border-brand-border">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-brand-cream flex items-center justify-center rounded-2xl text-brand-sage mb-4">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold font-display text-brand-sage serif tracking-tight">
            Personal Life OS
          </h2>
          <p className="mt-2 text-xs text-brand-text opacity-70 max-w-sm mx-auto">
            Your custom, secure, and private dashboard to track daily habits, health, workouts, and media.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-brand-text p-3 bg-brand-bg rounded-xl border border-brand-border/40">
            <Database className="h-5 w-5 text-brand-sage mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs text-brand-sage">Private Database</p>
              <p className="text-[11px] text-brand-text opacity-80 mt-0.5">Your data lives entirely in your own Google Drive in a spreadsheet named <b>Life OS Database</b>. We do not store or see your logs.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-brand-text p-3 bg-brand-bg rounded-xl border border-brand-border/40">
            <FileSpreadsheet className="h-5 w-5 text-brand-olive mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs text-brand-sage">Connected Sheets Backend</p>
              <p className="text-[11px] text-brand-text opacity-80 mt-0.5">Auto-generates tabs for your <b>Diary</b>, <b>Workouts</b>, <b>Movies</b>, and <b>Books</b>. Completely free and accessible on your phone too!</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-brand-text p-3 bg-brand-bg rounded-xl border border-brand-border/40">
            <CalendarDays className="h-5 w-5 text-brand-sage mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs text-brand-sage">Unified Dynamic Feed</p>
              <p className="text-[11px] text-brand-text opacity-80 mt-0.5">Connect diary entries directly with workouts completed, movies watched, or chapters finished on the same day.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium space-y-2">
            <p className="font-bold">{error.includes('popup-closed-by-user') ? 'Sign-In Popup Closed' : 'Sign-In Failed'}</p>
            <p className="opacity-90 leading-relaxed text-[11px]">
              {error.includes('popup-closed-by-user') 
                ? "The Google authentication popup was closed before completing. This often happens due to browser security restrictions or third-party cookie blocking inside an embedded workspace iframe." 
                : error}
            </p>
            {error.includes('popup-closed-by-user') && (
              <p className="text-[11px] font-bold text-red-800 bg-red-100/50 p-2.5 rounded-lg border border-red-200/50 mt-1.5 leading-normal">
                💡 Tip: Try opening this application in a <b>New Tab</b> using the button in the top right corner of the AI Studio preview to completely bypass iframe popup constraints!
              </p>
            )}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-brand-gray-border rounded-xl bg-white hover:bg-brand-bg text-brand-text font-semibold text-xs transition-all cursor-pointer shadow-sm disabled:opacity-55 gap-3"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-brand-sage border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path fill="#EA4335" d="M20 12.3c0-.7-.1-1.3-.2-1.9H12v3.6h4.5c-.2 1-.8 1.8-1.6 2.3v1.9h2.6c1.5-1.4 2.5-3.5 2.5-5.9z"></path>
                  <path fill="#4285F4" d="M12 20.4c2.2 0 4-1.3 5-3.3l-2.6-1.9c-.7.5-1.5.8-2.4.8-1.9 0-3.5-1.3-4-3l-2.7 2c1.3 2.6 4 4.4 6.7 4.4z"></path>
                  <path fill="#FBBC05" d="M8 12c0-.5.1-.9.2-1.4l-2.7-2c-.5.9-.7 2-.7 3.4 0 1.4.2 2.5.7 3.4l2.7-2c-.1-.5-.2-.9-.2-1.4z"></path>
                  <path fill="#34A853" d="M12 7.6c1.2 0 2.2.4 3 1.2l2.3-2.3C15.9 5.3 14.1 4.6 12 4.6 9.3 4.6 6.6 6.4 5.3 9l2.7 2c.5-1.7 2.1-3 4-3z"></path>
                </g>
              </svg>
            )}
            <span>{loading ? 'Connecting with Google...' : 'Sign in with Google'}</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-brand-text opacity-50">
          We use Google Sheets API securely. No subscriptions or middleman databases required.
        </div>
      </div>
    </div>
  );
}

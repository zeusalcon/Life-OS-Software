import React, { useState } from 'react';
import { MediaEntry } from '../types';
import { Film, Calendar, Star, Plus, Save, Trash2, Edit2, Sparkles, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface MediaTabProps {
  media: MediaEntry[];
  onAddMedia: (entry: Omit<MediaEntry, 'rowIndex'>) => Promise<void>;
  onUpdateMedia: (entry: MediaEntry) => Promise<void>;
  onDeleteMedia: (rowIndex: number) => Promise<void>;
}

export default function MediaTab({
  media,
  onAddMedia,
  onUpdateMedia,
  onDeleteMedia
}: MediaTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'To Watch' | 'Watching' | 'Completed'>('All');

  // Form State
  const [dateWatched, setDateWatched] = useState<string>(getMountainDateString());
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<'Movie' | 'TV Show'>('Movie');
  const [rating, setRating] = useState<number>(5);
  const [status, setStatus] = useState<'To Watch' | 'Watching' | 'Completed'>('Completed');
  const [review, setReview] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (item: MediaEntry) => {
    setEditingMedia(item);
    setDateWatched(item.dateWatched);
    setTitle(item.title);
    setType(item.type);
    setRating(item.rating);
    setStatus(item.status);
    setReview(item.review);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingMedia(null);
    setDateWatched(getMountainDateString());
    setTitle('');
    setType('Movie');
    setRating(5);
    setStatus('Completed');
    setReview('');
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateWatched) return;

    setIsSaving(true);
    try {
      if (editingMedia && editingMedia.rowIndex) {
        // Confirm update
        const confirmed = window.confirm(
          `Are you sure you want to update the entry for "${title}"?`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }

        await onUpdateMedia({
          ...editingMedia,
          dateWatched,
          title,
          type,
          rating,
          status,
          review,
        });
      } else {
        const id = 'media_' + Math.random().toString(36).substr(2, 9);
        await onAddMedia({
          id,
          dateWatched,
          title,
          type,
          rating,
          status,
          review,
        });
      }
      handleCancel();
    } catch (err) {
      console.error(err);
      alert('Failed to save media entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (item: MediaEntry) => {
    if (!item.rowIndex) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete your log of "${item.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await onDeleteMedia(item.rowIndex);
    } catch (err) {
      console.error(err);
      alert('Failed to delete media entry.');
    }
  };

  // Filter & Sort
  const filteredMedia = media.filter(item => {
    if (filterStatus === 'All') return true;
    return item.status === filterStatus;
  });
  const sortedMedia = [...filteredMedia].sort((a, b) => b.dateWatched.localeCompare(a.dateWatched));

  const statusColorMap = {
    'To Watch': 'bg-brand-cream text-brand-sage border border-brand-border/40',
    'Watching': 'bg-brand-sand/50 text-brand-sage border border-brand-border/40 animate-pulse',
    'Completed': 'bg-brand-sage text-white'
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-light-sand pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brand-sage flex items-center gap-2 serif">
            Media Log
          </h1>
          <p className="text-xs text-brand-text opacity-70 mt-1 font-medium">
            Track films, television seasons, log reviews, and rate your overall watching experiences.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-brand-cream/30 p-1 rounded-xl border border-brand-border/40 text-xs">
            <Filter className="h-3.5 w-3.5 text-brand-olive ml-1.5" />
            {(['All', 'To Watch', 'Watching', 'Completed'] as const).map(statusTab => (
              <button
                key={statusTab}
                onClick={() => setFilterStatus(statusTab)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  filterStatus === statusTab
                    ? 'bg-brand-sage text-white shadow-md shadow-brand-sage/10'
                    : 'text-brand-text opacity-70 hover:opacity-100 hover:bg-brand-bg/50'
                }`}
              >
                {statusTab}
              </button>
            ))}
          </div>

          {!isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-brand-sage hover:bg-brand-dark text-white rounded-xl shadow-md shadow-brand-sage/10 transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Log Media
            </button>
          )}
        </div>
      </div>

      {/* Media Logger Form */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-brand-border soft-shadow space-y-4"
        >
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-3">
            <h2 className="text-sm font-bold text-brand-sage flex items-center gap-1.5 serif">
              <Sparkles className="h-4 w-4 text-brand-olive" />
              {editingMedia ? `Edit Media Log: ${title}` : 'Log Movie or TV Show'}
            </h2>
            <button 
              onClick={handleCancel}
              className="text-xs text-brand-text opacity-50 hover:opacity-100 cursor-pointer font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Interstellar, Breaking Bad Season 1"
                  className="w-full px-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Media Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'Movie' | 'TV Show')}
                  className="w-full px-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold cursor-pointer"
                >
                  <option value="Movie">Movie</option>
                  <option value="TV Show">TV Show</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Date Logged/Watched
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-brand-olive" />
                  <input
                    type="date"
                    required
                    value={dateWatched}
                    onChange={(e) => setDateWatched(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Watching Status
                </label>
                <div className="flex gap-1.5">
                  {(['To Watch', 'Watching', 'Completed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        status === s
                          ? 'bg-brand-sage text-white border-brand-sage shadow-md shadow-brand-sage/10'
                          : 'bg-brand-bg/50 text-brand-text opacity-70 border-brand-gray-border hover:bg-brand-cream'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Rating ({rating}/5 Stars)
                </label>
                <div className="flex items-center gap-1.5 h-9.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-brand-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                Review / Thoughts
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Mind-bending cinematic masterpiece! Outstanding acting, pacing, and visual soundtrack by Hans Zimmer..."
                rows={3}
                className="w-full px-3 py-2.5 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive leading-relaxed font-sans"
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
                {isSaving ? 'Saving to Sheets...' : editingMedia ? 'Update Log' : 'Save Log'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Media Records Grid */}
      <div className="space-y-4">
        {sortedMedia.length === 0 ? (
          <div className="text-center py-16 bg-white border border-brand-border rounded-[32px] soft-shadow">
            <Film className="mx-auto h-12 w-12 text-brand-olive opacity-40 mb-3" />
            <h3 className="text-sm font-semibold text-brand-sage">No media entries found</h3>
            <p className="text-xs text-brand-text opacity-60 mt-1 max-w-sm mx-auto font-medium">
              {filterStatus === 'All' 
                ? 'Your film backlog is waiting. Log movies, TV shows, and write reviews to begin.' 
                : `No media matches the status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMedia.map((item) => (
              <motion.div
                key={item.id || item.rowIndex}
                className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition group"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-light-sand pb-2">
                    <span className="text-[10px] font-mono font-bold text-brand-text opacity-50 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-brand-olive" /> {item.dateWatched}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-brand-sage rounded hover:bg-brand-bg cursor-pointer"
                        title="Edit Log"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-red-600 rounded hover:bg-brand-bg cursor-pointer"
                        title="Delete Log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-brand-sage leading-snug serif">{item.title}</h3>
                      <span className="text-[10px] text-brand-text opacity-50 font-medium block">{item.type}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded-lg ${statusColorMap[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-brand-border'
                        }`}
                      />
                    ))}
                  </div>

                  {item.review && (
                    <p className="text-xs text-brand-text opacity-95 leading-relaxed font-sans font-medium italic bg-brand-cream/30 p-3 rounded-xl border border-brand-border/40">
                      &ldquo;{item.review}&rdquo;
                    </p>
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

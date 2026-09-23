import React, { useState } from 'react';
import { BookEntry } from '../types';
import { BookOpen, Calendar, BookMarked, Plus, Save, Trash2, Edit2, Sparkles, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { getMountainDateString } from '../lib/dateUtils';

interface BooksTabProps {
  books: BookEntry[];
  onAddBook: (entry: Omit<BookEntry, 'rowIndex'>) => Promise<void>;
  onUpdateBook: (entry: BookEntry) => Promise<void>;
  onDeleteBook: (rowIndex: number) => Promise<void>;
}

export default function BooksTab({
  books,
  onAddBook,
  onUpdateBook,
  onDeleteBook
}: BooksTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'To Read' | 'Reading' | 'Completed'>('All');

  // Form State
  const [dateLogged, setDateLogged] = useState<string>(getMountainDateString());
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [format, setFormat] = useState<'Audiobook' | 'Kindle' | 'Physical' | 'E-book'>('Physical');
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'To Read' | 'Reading' | 'Completed'>('Reading');
  const [keyTakeaways, setKeyTakeaways] = useState<string>('');
  const [dateFinished, setDateFinished] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (book: BookEntry) => {
    setEditingBook(book);
    setDateLogged(book.dateLogged);
    setTitle(book.title);
    setAuthor(book.author);
    setFormat(book.format);
    setProgress(book.progress);
    setStatus(book.status);
    setKeyTakeaways(book.keyTakeaways);
    setDateFinished(book.dateFinished);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingBook(null);
    setDateLogged(getMountainDateString());
    setTitle('');
    setAuthor('');
    setFormat('Physical');
    setProgress(0);
    setStatus('Reading');
    setKeyTakeaways('');
    setDateFinished('');
    setIsFormOpen(false);
  };

  const handleStatusChange = (newStatus: 'To Read' | 'Reading' | 'Completed') => {
    setStatus(newStatus);
    if (newStatus === 'Completed') {
      setProgress(100);
      if (!dateFinished) {
        setDateFinished(getMountainDateString());
      }
    } else if (newStatus === 'To Read') {
      setProgress(0);
      setDateFinished('');
    }
  };

  const handleProgressChange = (val: number) => {
    setProgress(val);
    if (val === 100) {
      setStatus('Completed');
      if (!dateFinished) {
        setDateFinished(getMountainDateString());
      }
    } else if (val === 0) {
      setStatus('To Read');
      setDateFinished('');
    } else {
      setStatus('Reading');
      setDateFinished('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    setIsSaving(true);
    try {
      if (editingBook && editingBook.rowIndex) {
        const confirmed = window.confirm(
          `Are you sure you want to update the entry for "${title}"?`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }

        await onUpdateBook({
          ...editingBook,
          dateLogged,
          title,
          author,
          format,
          progress,
          status,
          keyTakeaways,
          dateFinished: status === 'Completed' ? dateFinished : '',
        });
      } else {
        const id = 'book_' + Math.random().toString(36).substr(2, 9);
        await onAddBook({
          id,
          dateLogged,
          title,
          author,
          format,
          progress,
          status,
          keyTakeaways,
          dateFinished: status === 'Completed' ? dateFinished : '',
        });
      }
      handleCancel();
    } catch (err) {
      console.error(err);
      alert('Failed to save book log.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (book: BookEntry) => {
    if (!book.rowIndex) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${book.title}" from your reading list? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await onDeleteBook(book.rowIndex);
    } catch (err) {
      console.error(err);
      alert('Failed to delete book entry.');
    }
  };

  // Filter & Sort
  const filteredBooks = books.filter(b => {
    if (filterStatus === 'All') return true;
    return b.status === filterStatus;
  });
  const sortedBooks = [...filteredBooks].sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));

  const statusColorMap = {
    'To Read': 'bg-brand-cream text-brand-sage border border-brand-border/40',
    'Reading': 'bg-brand-sand/50 text-brand-sage border border-brand-border/40 animate-pulse',
    'Completed': 'bg-brand-sage text-white'
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-light-sand pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brand-sage flex items-center gap-2 serif">
            Reading Tracker
          </h1>
          <p className="text-xs text-brand-text opacity-70 mt-1 font-medium">
            Maintain your literary stack, track reading progress, and store key takeaways.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-brand-cream/30 p-1 rounded-xl border border-brand-border/40 text-xs">
            <Filter className="h-3.5 w-3.5 text-brand-olive ml-1.5" />
            {(['All', 'To Read', 'Reading', 'Completed'] as const).map(statusTab => (
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
              <Plus className="h-4 w-4" /> Log Book
            </button>
          )}
        </div>
      </div>

      {/* Book Logger Form */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-brand-border soft-shadow space-y-4"
        >
          <div className="flex items-center justify-between border-b border-brand-light-sand pb-3">
            <h2 className="text-sm font-bold text-brand-sage flex items-center gap-1.5 serif">
              <Sparkles className="h-4 w-4 text-brand-olive" />
              {editingBook ? `Edit Book: ${title}` : 'Add Book to Reading Stack'}
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
                  Book Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sapiens: A Brief History of Humankind"
                  className="w-full px-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Author
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Yuval Noah Harari"
                  className="w-full px-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Date Logged
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-brand-olive" />
                  <input
                    type="date"
                    required
                    value={dateLogged}
                    onChange={(e) => setDateLogged(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Book Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold cursor-pointer"
                >
                  <option value="Physical">Physical Book</option>
                  <option value="Kindle">Kindle</option>
                  <option value="Audiobook">Audiobook</option>
                  <option value="E-book">E-book</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Reading Status
                </label>
                <div className="flex gap-1.5">
                  {(['To Read', 'Reading', 'Completed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
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
                  Reading Progress ({progress}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progress}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    className="w-full accent-brand-sage"
                  />
                  <span className="text-xs px-2.5 py-1 bg-brand-cream text-brand-sage font-bold rounded-lg border border-brand-border/40 whitespace-nowrap font-semibold">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>

            {status === 'Completed' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                  Date Finished
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-brand-olive" />
                  <input
                    type="date"
                    required
                    value={dateFinished}
                    onChange={(e) => setDateFinished(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-brand-bg/50 border border-brand-gray-border rounded-xl text-brand-text outline-none focus:border-brand-olive font-semibold"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-brand-text opacity-60 uppercase tracking-wider mb-1.5">
                Key Takeaways / Highlights
              </label>
              <textarea
                value={keyTakeaways}
                onChange={(e) => setKeyTakeaways(e.target.value)}
                placeholder="The cognitive revolution allowed humans to cooperate flexibly in large numbers based on shared myths..."
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
                {isSaving ? 'Saving to Sheets...' : editingBook ? 'Update Book' : 'Save Book'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Book List Grid */}
      <div className="space-y-4">
        {sortedBooks.length === 0 ? (
          <div className="text-center py-16 bg-white border border-brand-border rounded-[32px] soft-shadow">
            <BookOpen className="mx-auto h-12 w-12 text-brand-olive opacity-40 mb-3" />
            <h3 className="text-sm font-semibold text-brand-sage">No books found</h3>
            <p className="text-xs text-brand-text opacity-60 mt-1 max-w-sm mx-auto font-medium">
              {filterStatus === 'All' 
                ? 'Your reading queue is empty. Log books and track progress directly.' 
                : `No books match the status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBooks.map((book) => (
              <motion.div
                key={book.id || book.rowIndex}
                className="bg-white p-5 rounded-[24px] border border-brand-border soft-shadow flex flex-col justify-between hover:border-brand-olive/40 transition group"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-brand-light-sand pb-2">
                    <span className="text-[10px] font-mono font-bold text-brand-text opacity-50 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-brand-olive" /> {book.dateLogged}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(book)}
                        className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-brand-sage rounded hover:bg-brand-bg cursor-pointer"
                        title="Edit Book"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        className="p-1 text-brand-text opacity-50 hover:opacity-100 hover:text-red-600 rounded hover:bg-brand-bg cursor-pointer"
                        title="Delete Book"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-brand-sage leading-snug serif">{book.title}</h3>
                      <span className="text-[10px] text-brand-text opacity-50 font-bold block">by {book.author}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded-lg ${statusColorMap[book.status]}`}>
                      {book.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] bg-brand-cream/30 text-brand-text opacity-85 font-semibold px-2.5 py-1 rounded-lg border border-brand-border/40">
                    <BookMarked className="h-3.5 w-3.5 text-brand-olive" />
                    <span>Format: {book.format}</span>
                    {book.status === 'Completed' && book.dateFinished && (
                      <span className="ml-auto">Finished: {book.dateFinished}</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-brand-text opacity-50">
                      <span>Reading Progress</span>
                      <span>{book.progress}%</span>
                    </div>
                    <div className="w-full bg-brand-cream/60 h-2 rounded-full overflow-hidden border border-brand-border/30">
                      <div className="bg-brand-olive h-full transition-all duration-300 rounded-full" style={{ width: `${book.progress}%` }}></div>
                    </div>
                  </div>

                  {book.keyTakeaways && (
                    <div className="mt-2 flex-1 flex flex-col justify-end">
                      <p className="text-xs text-brand-text opacity-95 leading-relaxed font-sans font-medium italic bg-brand-cream/30 p-3 rounded-xl border border-brand-border/40">
                        &ldquo;{book.keyTakeaways}&rdquo;
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

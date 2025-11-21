'use client';

import { useState, useEffect } from 'react';
import { UploadForm } from '@/components/upload';
import { NotesDisplay } from '@/components/notes-display';
import History from '@/components/history';
import type { LectureNotes } from '@/types';

const STORAGE_KEY = 'talk2notes_last_result';

export default function HomePage() {
  const [lectureNotes, setLectureNotes] = useState<LectureNotes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load saved notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLectureNotes(parsed);
      }
    } catch (err) {
      console.error('Failed to load saved notes:', err);
    }
  }, []);

  const handleSuccess = (notes: LectureNotes) => {
    setLectureNotes(notes);
    setError(null);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setLectureNotes(null);
  };

  const handleReset = () => {
    setLectureNotes(null);
    setError(null);

    // Clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear saved notes:', err);
    }
  };

  const handleSelectHistory = (notes: LectureNotes) => {
    setLectureNotes(notes);
    setError(null);
    setShowHistory(false);

    // Scroll to top to show notes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Transform Lectures into Structured Notes
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Upload audio or video files and let AI generate comprehensive, organized lecture notes
          with key concepts, definitions, examples, and action items.
        </p>

        {/* Islamic Lectures Highlight */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a4 4 0 100 8 4 4 0 000-8z" />
            <path d="M10 7a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" />
          </svg>
          <span className="text-sm font-medium text-emerald-800">
            🕌 Perfect for Islamic Lectures & Islamic Studies
          </span>
          <span className="text-xs text-emerald-600">• Preserves Arabic, Dalil & References</span>
        </div>

        {/* History Toggle Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="mb-12">
          <History onSelectItem={handleSelectHistory} />
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {!lectureNotes ? (
        <UploadForm onSuccess={handleSuccess} onError={handleError} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Upload Another File
            </button>
          </div>
          <NotesDisplay notes={lectureNotes} />
        </div>
      )}

      <div className="mt-16 border-t border-gray-200 pt-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Upload</h3>
            <p className="text-gray-600">
              Drag and drop or click to upload audio and video files. Supports MP3, WAV, MP4, and
              more.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Processing</h3>
            <p className="text-gray-600">
              Advanced AI transcribes audio and generates structured notes with key concepts and
              summaries.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🕌 Islamic Content</h3>
            <p className="text-gray-600">
              Specialized for Islamic Studies. Preserves Arabic text with harakat, Quranic verses,
              Hadith references, transliteration, and translations.
            </p>
          </div>
        </div>
      </div>

      {/* Islamic Hadith */}
      <div className="mt-12 text-center pb-8 max-w-3xl mx-auto">
        <p className="text-2xl font-arabic text-emerald-700 mb-4 leading-relaxed" dir="rtl">
          مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى
          الجَنَّةِ
        </p>
        <p className="text-base text-gray-700 mb-2">
          "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to
          Paradise."
        </p>
        <p className="text-sm text-gray-500">— Narrated by Muslim (2699)</p>
      </div>
    </div>
  );
}

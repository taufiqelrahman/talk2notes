'use client';

import { useState } from 'react';
import { UploadForm } from '@/components/upload';
import { NotesDisplay } from '@/components/notes-display';
import type { LectureNotes } from '@/types';

export default function HomePage() {
  const [lectureNotes, setLectureNotes] = useState<LectureNotes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (notes: LectureNotes) => {
    setLectureNotes(notes);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setLectureNotes(null);
  };

  const handleReset = () => {
    setLectureNotes(null);
    setError(null);
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
      </div>

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
              Drag and drop or click to upload audio and video files. Supports MP3, WAV, MP4, and more.
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
              Advanced AI transcribes audio and generates structured notes with key concepts and summaries.
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Notes</h3>
            <p className="text-gray-600">
              Download your notes as JSON or Markdown files for easy sharing and integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

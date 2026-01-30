'use client';

import { useEffect, useState } from 'react';
import type { HistoryItem, LectureNotes } from '@/types';
import { getHistory, deleteFromHistory, clearHistory, formatTimestamp } from '@/utils/history';

interface HistoryProps {
  onSelectItem: (notes: LectureNotes) => void;
}

export default function History({ onSelectItem }: HistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const loadHistory = () => {
    setHistory(getHistory());
  };

  useEffect(() => {
    loadHistory();

    // Listen for storage events to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'talk2notes_history') {
        loadHistory();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleHistoryUpdate = () => loadHistory();
    window.addEventListener('historyUpdated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('historyUpdated', handleHistoryUpdate);
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromHistory(id);
    loadHistory();
    window.dispatchEvent(new Event('historyUpdated'));
  };

  const handleClearAll = () => {
    clearHistory();
    loadHistory();
    setShowConfirmClear(false);
    window.dispatchEvent(new Event('historyUpdated'));
  };

  const handleSelectItem = (item: HistoryItem) => {
    onSelectItem(item.notes);

    // Save as last result for auto-load
    try {
      localStorage.setItem('talk2notes_last_result', JSON.stringify(item.notes));
    } catch (error) {
      console.error('Failed to save last result:', error);
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">No history yet</p>
        <p className="text-gray-400 text-sm mt-1">Your transcriptions will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          History <span className="text-sm font-normal text-gray-500">({history.length})</span>
        </h2>
        {history.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {showConfirmClear && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <p className="text-sm text-red-800 mb-3">
            Are you sure you want to delete all history? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, Delete All
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectItem(item)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    {item.source === 'youtube' ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    ) : item.source === 'url' ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                    <span className="capitalize">
                      {item.source === 'url' ? 'Media URL' : item.source}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    {item.language === 'id'
                      ? '🇮🇩 Indonesian'
                      : item.language === 'ar'
                        ? '🇸🇦 Arabic'
                        : '🇬🇧 English'}
                  </span>
                  <span>•</span>
                  <span>{formatTimestamp(item.timestamp)}</span>
                </div>
                {item.notes.summary && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.notes.summary}</p>
                )}
              </div>
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

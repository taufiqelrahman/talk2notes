'use client';

import { useEffect, useRef, useState } from 'react';

interface MediaPlayerProps {
  sourceUrl: string;
  sourceType: 'youtube' | 'url';
  fileName: string;
}

export function MediaPlayer({ sourceUrl, sourceType, fileName }: MediaPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const originalTopRef = useRef<number>(0);

  useEffect(() => {
    // Store original position
    if (playerRef.current && originalTopRef.current === 0) {
      originalTopRef.current = playerRef.current.getBoundingClientRect().top + window.scrollY;
    }

    const handleScroll = () => {
      if (playerRef.current && originalTopRef.current > 0) {
        const scrollY = window.scrollY;
        const shouldStick = scrollY > originalTopRef.current - 70;
        setIsSticky(shouldStick);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      let videoId: string | null = null;

      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (sourceType === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(sourceUrl);

    if (!embedUrl) {
      return (
        <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Could not load YouTube video</span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={playerRef}
        className={`bg-red-50 rounded-lg border border-red-300 transition-all duration-300 ${
          isSticky ? 'fixed top-16 right-4 z-40 shadow-xl w-80' : 'w-full'
        } ${isMinimized ? 'p-1.5' : isSticky ? 'p-2' : 'p-4'}`}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg
            className={`${isSticky ? 'w-3 h-3' : 'w-4 h-4'} text-red-600`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span className={`${isSticky ? 'text-[10px]' : 'text-xs'} font-medium text-red-900`}>
            YouTube
          </span>
          <span className={`${isSticky ? 'text-[10px]' : 'text-xs'} text-gray-500 truncate flex-1`}>
            {fileName}
          </span>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-0.5 hover:bg-red-100 rounded transition-colors"
            title={isMinimized ? 'Expand player' : 'Minimize player'}
          >
            <svg
              className={`${isSticky ? 'w-3 h-3' : 'w-4 h-4'} text-red-700`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMinimized ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              )}
            </svg>
          </button>
        </div>
        {!isMinimized && (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full rounded-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    );
  }

  // For direct media URLs
  return (
    <div
      ref={playerRef}
      className={`bg-blue-50 rounded-lg border border-blue-300 transition-all duration-300 ${
        isSticky ? 'fixed top-16 right-4 z-40 shadow-xl w-80' : 'w-full'
      } ${isMinimized ? 'p-1.5' : isSticky ? 'p-2' : 'p-4'}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg
          className={`${isSticky ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className={`${isSticky ? 'text-[10px]' : 'text-xs'} font-medium text-blue-900`}>
          Media
        </span>
        <span className={`${isSticky ? 'text-[10px]' : 'text-xs'} text-blue-700 truncate flex-1`}>
          {fileName}
        </span>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-0.5 hover:bg-blue-100 rounded transition-colors"
          title={isMinimized ? 'Expand player' : 'Minimize player'}
        >
          <svg
            className={`${isSticky ? 'w-3 h-3' : 'w-4 h-4'} text-blue-700`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMinimized ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            )}
          </svg>
        </button>
      </div>
      {!isMinimized && (
        <video
          controls
          preload="metadata"
          className="w-full rounded-md"
          onError={() => setError('Failed to load media')}
        >
          <source src={sourceUrl} />
          Your browser does not support video playback.
        </video>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

'use client';

import { useState, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { ProgressIndicator } from './progress';
import { ProcessingSteps } from './processing-steps';
import { ProcessingTips } from './processing-tips';
import { createTranscriptionMutation } from '@/actions/transcription';
import type { LectureNotes } from '@/types';

interface UploadFormProps {
  onSuccess?: (notes: LectureNotes) => void;
  onError?: (error: string) => void;
}

export function UploadForm({ onSuccess, onError }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'youtube'>('file');
  const [language, setLanguage] = useState<'english' | 'indonesian'>('english');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const [progressDetails, setProgressDetails] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  const estimateProcessingTime = (fileSizeMB: number): string => {
    // Rough estimates based on file size
    const minutes = Math.ceil(fileSizeMB * 0.5 + 1); // ~30s per MB + 1 min base
    if (minutes < 2) return '1-2 minutes';
    if (minutes < 5) return '2-5 minutes';
    if (minutes < 10) return '5-10 minutes';
    return `${minutes} minutes`;
  };

  const simulateProgress = (
    startProgress: number,
    endProgress: number,
    duration: number,
    callback?: () => void
  ) => {
    const steps = 20;
    const increment = (endProgress - startProgress) / steps;
    const interval = duration / steps;

    let current = startProgress;
    const timer = setInterval(() => {
      current += increment;
      if (current >= endProgress) {
        setProgress(endProgress);
        clearInterval(timer);
        callback?.();
      } else {
        setProgress(Math.floor(current));
      }
    }, interval);

    return timer;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (inputMode === 'file' && !selectedFile) {
      onError?.('Please select a file');
      return;
    }

    if (inputMode === 'youtube' && !youtubeUrl) {
      onError?.('Please enter a YouTube URL');
      return;
    }

    setIsUploading(true);
    setProgress(5);

    try {
      const formData = new FormData();

      if (inputMode === 'youtube') {
        setCurrentStep('Downloading from YouTube...');
        setProgressDetails(`URL: ${youtubeUrl}`);
        formData.append('youtubeUrl', youtubeUrl);
        formData.append('language', language);
        setEstimatedTime('3-10 minutes');
      } else {
        setCurrentStep('Validating file...');
        setProgressDetails(`File: ${selectedFile!.name} (${formatFileSize(selectedFile!.size)})`);
        const fileSizeMB = selectedFile!.size / (1024 * 1024);
        const estimatedDuration = estimateProcessingTime(fileSizeMB);
        setEstimatedTime(estimatedDuration);
        formData.append('file', selectedFile!);
        formData.append('language', language);
      }

      // Validation phase (5-15%)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setProgress(15);

      if (inputMode === 'youtube') {
        setCurrentStep('Processing YouTube video...');
        setProgressDetails('Downloading and extracting audio...');
        const uploadTimer = simulateProgress(15, 35, 3000);

        // Start actual processing
        const processingPromise = createTranscriptionMutation(formData);

        await new Promise((resolve) => setTimeout(resolve, 3000));
        clearInterval(uploadTimer);
        setProgress(35);

        // Continue with transcription
        const transcribeStart = 35;
        setCurrentStep('Transcribing audio to text...');
        setProgressDetails('Converting speech to text with AI...');
        simulateProgress(transcribeStart, 70, 15000);

        const result = await processingPromise;
        setProgress(100);
        setCurrentStep('Complete!');

        if (result.success && result.data) {
          onSuccess?.(result.data);
        } else {
          throw new Error(result.error || 'Failed to process YouTube video');
        }
      } else {
        setCurrentStep('Uploading file...');
        setProgressDetails(`Uploading ${formatFileSize(selectedFile!.size)}...`);

        // Upload simulation (15-25%)
        const uploadTimer = simulateProgress(15, 25, 1000);

        // Start actual processing
        const processingPromise = createTranscriptionMutation(formData);

        // Complete upload simulation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        clearInterval(uploadTimer);

        setProgress(25);

        // Check if video or audio
        const isVideo = selectedFile!.type.startsWith('video/');
        const fileSizeMB = selectedFile!.size / (1024 * 1024);

        if (isVideo) {
          setCurrentStep('Extracting audio from video...');
          setProgressDetails('Converting video to audio format...');
          simulateProgress(25, 35, 2000);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Compression check (if file > 10MB)
        if (fileSizeMB > 10) {
          setProgress(isVideo ? 35 : 25);
          setCurrentStep('Compressing audio for better reliability...');
          setProgressDetails(`Reducing ${fileSizeMB.toFixed(1)}MB to ~8MB...`);
          simulateProgress(isVideo ? 35 : 25, isVideo ? 45 : 35, 3000);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        // Transcription phase (longest part)
        const transcribeStart = fileSizeMB > 10 ? (isVideo ? 45 : 35) : isVideo ? 35 : 25;
        setProgress(transcribeStart);
        setCurrentStep('Transcribing audio with AI...');
        setProgressDetails('Converting speech to text... This may take a few minutes.');

        // Slower progress for transcription (it's the longest step)
        const transcribeDuration = Math.max(8000, fileSizeMB * 1000); // At least 8 seconds
        simulateProgress(transcribeStart, 75, transcribeDuration);

        // Wait for actual result
        const result = await processingPromise;

        if (!result.success) {
          throw new Error(result.error || 'Processing failed');
        }

        // Summarization phase
        setProgress(80);
        setCurrentStep('Generating structured notes...');
        setProgressDetails('Creating summary, key concepts, and action items...');
        simulateProgress(80, 95, 3000);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setProgress(100);
        setCurrentStep('Complete! ✅');
        setProgressDetails('Your lecture notes are ready!');

        if (result.data) {
          onSuccess?.(result.data);
        }

        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentStep('Error ❌');
      setProgressDetails(error instanceof Error ? error.message : 'An error occurred');
      onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        setCurrentStep('');
        setProgressDetails('');
        setEstimatedTime('');
      }, 3000);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle between File and YouTube */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'file'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setInputMode('youtube')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'youtube'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            YouTube URL
          </button>
        </div>

        {inputMode === 'youtube' ? (
          <div className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isUploading}
              />
              <p className="mt-2 text-xs text-gray-500">
                Paste a YouTube video URL to download and transcribe its audio
              </p>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mkv,.mov"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />

            {!selectedFile ? (
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-primary-600 hover:text-primary-500">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">Audio: MP3, WAV, M4A, AAC, OGG, FLAC</p>
                  <p className="text-xs text-gray-500">Video: MP4, MKV, MOV, AVI, WEBM</p>
                  <p className="text-xs text-gray-500">Max file size: 100MB</p>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Info message for large files */}
                {selectedFile && selectedFile.size > 10 * 1024 * 1024 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">
                          Large file detected ({formatFileSize(selectedFile.size)})
                        </p>
                        <p className="text-xs mt-1">
                          This file will be automatically compressed to ~8MB for optimal upload
                          reliability. Processing may take a bit longer.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Language Selection */}
        {((inputMode === 'file' && selectedFile) || (inputMode === 'youtube' && youtubeUrl)) &&
          !isUploading && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Output Language / Bahasa Output
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('english')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    language === 'english'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl mr-2">🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('indonesian')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    language === 'indonesian'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl mr-2">🇮🇩</span>
                  <span>Bahasa Indonesia</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                📖 Arabic text (Quran/Hadith) will be preserved with transliteration and translation
              </p>
            </div>
          )}

        {isUploading && (
          <div className="space-y-4">
            <ProcessingSteps currentStep={currentStep} />
            <ProgressIndicator
              progress={progress}
              step={currentStep}
              details={progressDetails}
              estimatedTime={estimatedTime}
            />
            <ProcessingTips />
          </div>
        )}

        <button
          type="submit"
          disabled={
            (inputMode === 'file' && !selectedFile) ||
            (inputMode === 'youtube' && !youtubeUrl) ||
            isUploading
          }
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Processing...' : 'Generate Lecture Notes'}
        </button>
      </form>
    </div>
  );
}

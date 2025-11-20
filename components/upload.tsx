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

    if (!selectedFile) {
      onError?.('Please select a file');
      return;
    }

    setIsUploading(true);
    setProgress(5);
    setCurrentStep('Validating file...');
    setProgressDetails(`File: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`);

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const estimatedDuration = estimateProcessingTime(fileSizeMB);
    setEstimatedTime(estimatedDuration);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Validation phase (5-15%)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setProgress(15);
      setCurrentStep('Uploading file...');
      setProgressDetails(`Uploading ${formatFileSize(selectedFile.size)}...`);

      // Upload simulation (15-25%)
      const uploadTimer = simulateProgress(15, 25, 1000);

      // Start actual processing
      const processingPromise = createTranscriptionMutation(formData);

      // Complete upload simulation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      clearInterval(uploadTimer);

      setProgress(25);

      // Check if video or audio
      const isVideo = selectedFile.type.startsWith('video/');

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
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>
          )}
        </div>

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
          disabled={!selectedFile || isUploading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Processing...' : 'Generate Lecture Notes'}
        </button>
      </form>
    </div>
  );
}

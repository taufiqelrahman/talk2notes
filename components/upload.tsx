'use client';

import { useState, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { ProgressIndicator } from './progress';
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
      onError?.('Please select a file');
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setCurrentStep('Validating file...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setProgress(20);
      setCurrentStep('Uploading file...');

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(40);
      setCurrentStep('Extracting audio...');

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(60);
      setCurrentStep('Transcribing audio...');

      const result = await createTranscriptionMutation(formData);

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      setProgress(90);
      setCurrentStep('Generating notes...');

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);
      setCurrentStep('Complete!');

      if (result.data) {
        onSuccess?.(result.data);
      }
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);
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
                <p className="text-xs text-gray-500">
                  Audio: MP3, WAV, M4A, AAC, OGG, FLAC
                </p>
                <p className="text-xs text-gray-500">
                  Video: MP4, MKV, MOV, AVI, WEBM
                </p>
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
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
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
            </div>
          )}
        </div>

        {isUploading && (
          <ProgressIndicator
            progress={progress}
            step={currentStep}
          />
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

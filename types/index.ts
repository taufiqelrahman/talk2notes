export interface UploadedFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface LectureNotes {
  title: string;
  summary: string;
  paragraphs: string[];
  bulletPoints: string[];
  keyConcepts: KeyConcept[];
  definitions: Definition[];
  exampleProblems: ExampleProblem[];
  actionItems: string[];
  transcript?: string;
  metadata: NotesMetadata;
}

export interface KeyConcept {
  concept: string;
  explanation: string;
  importance: 'high' | 'medium' | 'low';
}

export interface Definition {
  term: string;
  definition: string;
  context?: string;
}

export interface ExampleProblem {
  problem: string;
  solution?: string;
  explanation?: string;
}

export interface NotesMetadata {
  generatedAt: string;
  transcriptionModel: string;
  summarizationModel: string;
  originalFilename: string;
  duration?: number;
  wordCount: number;
}

export interface ProcessingState {
  step:
    | 'uploading'
    | 'extracting'
    | 'compressing'
    | 'transcribing'
    | 'summarizing'
    | 'complete'
    | 'error';
  progress: number;
  message: string;
  details?: string; // Additional details like file size, duration, etc.
}

export interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type AIProvider = 'openai' | 'groq' | 'deepgram' | 'anthropic';

export interface AIConfig {
  provider: AIProvider;
  transcriptionModel: string;
  summarizationModel: string;
  apiKey: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'audio' | 'video';
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface SummarizationOptions {
  detailLevel?: 'concise' | 'detailed' | 'comprehensive';
  focusAreas?: string[];
  language?: 'english' | 'indonesian';
}

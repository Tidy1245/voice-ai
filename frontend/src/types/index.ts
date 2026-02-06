export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface TranscriptionResult {
  success: boolean;
  transcription: string;
  duration: number;
  model_used: string;
  diff: DiffSegment[] | null;
  id?: number;
}

export interface HistoryRecord {
  id: number;
  filename: string;
  model_used: string;
  transcription: string;
  reference_text: string | null;
  duration: number;
  created_at: string;
  diff: DiffSegment[] | null;
}

export interface HistoryResponse {
  total: number;
  records: HistoryRecord[];
}

export interface ModelsResponse {
  models: Model[];
}

export type InputMode = 'upload' | 'record';

export type ModelId = 'faster-whisper' | 'whisper-taiwanese' | 'formospeech' | 'dolphin-taiwanese';

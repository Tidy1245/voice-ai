import type { TranscriptionResult, HistoryResponse, ModelsResponse, HistoryRecord } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function getModels(): Promise<ModelsResponse> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  return response.json();
}

export async function transcribe(
  audio: File | Blob,
  model: string,
  referenceText?: string,
  filename?: string
): Promise<TranscriptionResult> {
  const formData = new FormData();

  const audioFile = audio instanceof File
    ? audio
    : new File([audio], filename || 'recording.webm', { type: audio.type });

  formData.append('audio', audioFile);
  formData.append('model', model);

  if (referenceText) {
    formData.append('reference_text', referenceText);
  }

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
    throw new Error(error.detail || 'Transcription failed');
  }

  return response.json();
}

export async function getHistory(limit = 20, offset = 0): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE}/history?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  return response.json();
}

export async function getHistoryById(id: number): Promise<HistoryRecord> {
  const response = await fetch(`${API_BASE}/history/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch history record');
  }
  return response.json();
}

export async function deleteHistory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete history record');
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

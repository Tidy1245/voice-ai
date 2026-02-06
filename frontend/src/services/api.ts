import type { TranscriptionResult, HistoryResponse, ModelsResponse, HistoryRecord } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token storage
const TOKEN_KEY = 'voice-ai-token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// Auth API
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
  };
  message?: string;
}

export interface User {
  id: number;
  username: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Login failed');
  }
  const data = await response.json();
  if (data.success && data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function logout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {});
  }
  setStoredToken(null);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      setStoredToken(null);
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

// Models API
export async function getModels(): Promise<ModelsResponse> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  return response.json();
}

// Transcription API
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
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
    throw new Error(error.detail || 'Transcription failed');
  }

  return response.json();
}

// History API
export async function getHistory(limit = 20, offset = 0): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE}/history?limit=${limit}&offset=${offset}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  return response.json();
}

export async function getHistoryById(id: number): Promise<HistoryRecord> {
  const response = await fetch(`${API_BASE}/history/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch history record');
  }
  return response.json();
}

export async function deleteHistory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete history record');
  }
}

export async function clearAllHistory(): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/history`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to clear history');
  }
  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Diff API
export interface DiffResponse {
  success: boolean;
  diff: { type: 'equal' | 'insert' | 'delete'; text: string }[];
}

export async function computeDiff(
  referenceText: string,
  transcription: string
): Promise<DiffResponse> {
  const response = await fetch(`${API_BASE}/diff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference_text: referenceText,
      transcription: transcription,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to compute diff');
  }

  return response.json();
}

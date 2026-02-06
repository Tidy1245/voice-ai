import { useState, useEffect, useRef } from 'react';
import type { TranscriptionResult, DiffSegment } from '../types';
import { DiffViewer } from './DiffViewer';
import { useLanguage } from '../contexts/LanguageContext';
import { computeDiff } from '../services/api';

interface ResultDisplayProps {
  result: TranscriptionResult | null;
  isLoading: boolean;
  referenceText?: string;
  onDiffUpdate?: (diff: DiffSegment[] | null) => void;
}

export function ResultDisplay({ result, isLoading, referenceText, onDiffUpdate }: ResultDisplayProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isRecomparing, setIsRecomparing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState<number | null>(null);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (isLoading) {
      wasLoading.current = true;
      setElapsed(0);
      setFinalElapsed(null);
      const timer = setInterval(() => setElapsed((s) => +(s + 0.1).toFixed(1)), 100);
      return () => clearInterval(timer);
    }
    if (wasLoading.current) {
      setFinalElapsed(elapsed);
      wasLoading.current = false;
    }
  }, [isLoading]);

  // Auto-hide toast after 2 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleRecompare = async () => {
    if (!result?.transcription) return;

    if (!referenceText || !referenceText.trim()) {
      setToast(t('result.noReferenceText'));
      return;
    }

    setIsRecomparing(true);
    try {
      const response = await computeDiff(referenceText, result.transcription);
      if (onDiffUpdate) {
        onDiffUpdate(response.diff.length > 0 ? response.diff : null);
      }
    } catch (err) {
      console.error('Failed to recompare:', err);
    } finally {
      setIsRecomparing(false);
    }
  };

  const getModelBadgeColor = (model: string): string => {
    switch (model) {
      case 'faster-whisper':
        return 'bg-blue-600/20 text-blue-300';
      case 'whisper-taiwanese':
        return 'bg-green-600/20 text-green-300';
      case 'formospeech':
        return 'bg-orange-600/20 text-orange-300';
      case 'dolphin-taiwanese':
        return 'bg-teal-600/20 text-teal-300';
      default:
        return 'bg-violet-600/20 text-violet-300';
    }
  };

  const handleCopy = async () => {
    if (!result?.transcription) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result.transcription);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = result.transcription;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-dark-600 border-t-violet-500 rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-gray-300 font-medium">{t('result.processing')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('result.wait')}</p>
            <p className="text-sm text-violet-400 font-mono mt-2">{elapsed.toFixed(1)}s</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="card space-y-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{t('result.title')}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getModelBadgeColor(result.model_used)}`}>
            {result.model_used.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </span>
          <span className="text-gray-500">{(finalElapsed ?? result.duration).toFixed(1)}s</span>
        </div>
      </div>

      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 max-w-full overflow-hidden">
        <p className="font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
          {result.transcription || <span className="text-gray-500 italic">{t('result.noSpeech')}</span>}
        </p>
      </div>

      {result.transcription && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              copied
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'text-gray-400 hover:text-white bg-dark-700 hover:bg-dark-600'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t('result.copied')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {t('result.copy')}
              </>
            )}
          </button>

          <button
            onClick={handleRecompare}
            disabled={isRecomparing}
            className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-gray-400 hover:text-white bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecomparing ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                {t('result.recomparing')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t('result.recompare')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-dark-700 border border-dark-600 text-gray-200 px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {result.diff && result.diff.length > 0 && <DiffViewer diff={result.diff} />}
    </div>
  );
}

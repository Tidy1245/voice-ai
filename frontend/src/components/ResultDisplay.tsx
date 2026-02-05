import { useState } from 'react';
import type { TranscriptionResult } from '../types';
import { DiffViewer } from './DiffViewer';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultDisplayProps {
  result: TranscriptionResult | null;
  isLoading: boolean;
}

export function ResultDisplay({ result, isLoading }: ResultDisplayProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result?.transcription) return;
    try {
      await navigator.clipboard.writeText(result.transcription);
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
          <span className="px-2 py-1 bg-violet-600/20 text-violet-300 rounded text-xs font-medium">
            {result.model_used}
          </span>
          <span className="text-gray-500">{result.duration.toFixed(1)}s</span>
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
        </div>
      )}

      {result.diff && result.diff.length > 0 && <DiffViewer diff={result.diff} />}
    </div>
  );
}

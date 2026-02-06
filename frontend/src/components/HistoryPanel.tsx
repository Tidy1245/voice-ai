import { useState, useEffect, useCallback } from 'react';
import type { HistoryRecord, DiffSegment } from '../types';
import { getHistory, deleteHistory, clearAllHistory } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryPanelProps {
  onSelectRecord: (record: HistoryRecord) => void;
  refreshTrigger?: number;
}

export function HistoryPanel({ onSelectRecord, refreshTrigger }: HistoryPanelProps) {
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const loadHistory = useCallback(async (loadOffset = 0, append = false) => {
    try {
      setIsLoading(true);
      const response = await getHistory(limit, loadOffset);
      if (append) {
        setRecords((prev) => [...prev, ...response.records]);
      } else {
        setRecords(response.records);
      }
      setTotal(response.total);
      setOffset(loadOffset);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(0, false);
  }, [loadHistory, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(t('history.confirmDelete'))) return;

    try {
      await deleteHistory(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(t('history.confirmClearAll'))) return;

    try {
      await clearAllHistory();
      setRecords([]);
      setTotal(0);
      setOffset(0);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleLoadMore = () => {
    loadHistory(offset + limit, true);
  };

  const formatDate = (dateString: string): string => {
    // Backend stores UTC time without 'Z' suffix, add it for correct parsing
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('history.justNow');
    if (language === 'zh') {
      if (diffMins < 60) return `${diffMins} 分鐘前`;
      if (diffHours < 24) return `${diffHours} 小時前`;
      if (diffDays < 7) return `${diffDays} 天前`;
    } else {
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
    }

    return date.toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const calcSimilarity = (diff: DiffSegment[]): number => {
    let matchedChars = 0;
    let totalChars = 0;
    diff.forEach((segment) => {
      const charCount = segment.text.length;
      if (segment.type === 'equal') {
        matchedChars += charCount;
        totalChars += charCount;
      } else if (segment.type === 'insert' || segment.type === 'delete') {
        totalChars += charCount;
      }
    });
    return totalChars > 0 ? Math.round((matchedChars / totalChars) * 100) : 0;
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
        return 'bg-gray-600/20 text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{t('history.title')}</h2>
        <span className="text-sm text-gray-500">{total} {t('history.records')}</span>
      </div>

      {records.length > 0 && (
        <button
          onClick={handleClearAll}
          className="mb-3 w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-red-400/30 hover:border-red-400/50"
        >
          {t('history.clearAll')}
        </button>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
        {records.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-gray-500 text-sm">{t('history.empty')}</p>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              onClick={() => onSelectRecord(record)}
              className="group bg-dark-700 hover:bg-dark-600 rounded-lg p-3 cursor-pointer transition-colors border border-transparent hover:border-dark-500"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{record.filename}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {record.transcription.slice(0, 50)}
                    {record.transcription.length > 50 ? '...' : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, record.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getModelBadgeColor(record.model_used)}`}>
                  {record.model_used.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
                {record.diff && record.diff.length > 0 && (() => {
                  const sim = calcSimilarity(record.diff);
                  const color = sim >= 80 ? 'bg-green-600/20 text-green-300' : sim >= 50 ? 'bg-yellow-600/20 text-yellow-300' : 'bg-red-600/20 text-red-300';
                  return (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
                      {sim}%
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-500">{formatDate(record.created_at)}</span>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-dark-600 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && records.length < total && (
          <button
            onClick={handleLoadMore}
            className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            {t('history.loadMore')}
          </button>
        )}
      </div>
    </div>
  );
}

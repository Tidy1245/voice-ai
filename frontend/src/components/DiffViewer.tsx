import type { DiffSegment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DiffViewerProps {
  diff: DiffSegment[];
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const { t } = useLanguage();

  if (!diff || diff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-300">{t('diff.title')}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-900/50 border border-green-700" />
            <span className="text-gray-500">{t('diff.matched')}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-900/50 border border-red-700" />
            <span className="text-gray-500">{t('diff.different')}</span>
          </span>
        </div>
      </div>
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
        <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {diff.map((segment, index) => (
            <span
              key={index}
              className={`
                ${segment.type === 'equal' ? 'diff-match px-0.5 rounded' : ''}
                ${segment.type === 'insert' || segment.type === 'delete' ? 'diff-error px-0.5 rounded' : ''}
              `}
            >
              {segment.text}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

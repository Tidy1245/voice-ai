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

  // Calculate similarity: green chars / total chars
  let matchedChars = 0;
  let totalChars = 0;

  diff.forEach((segment) => {
    const charCount = segment.text.length;
    if (segment.type === 'equal') {
      matchedChars += charCount;
      totalChars += charCount;
    } else if (segment.type === 'insert') {
      // Wrong/extra chars count toward total
      totalChars += charCount;
    } else if (segment.type === 'delete') {
      // Missing chars count toward total
      totalChars += charCount;
    }
  });

  const similarity = totalChars > 0 ? Math.round((matchedChars / totalChars) * 100) : 0;

  // Process diff to handle display logic:
  // - delete followed by insert = replacement, only show insert
  // - standalone delete = missing chars, show delete
  // - insert = wrong/extra chars, show insert
  // - equal = matched, show in green
  const processedDiff: Array<{ type: 'match' | 'error' | 'missing'; text: string }> = [];

  for (let i = 0; i < diff.length; i++) {
    const segment = diff[i];
    const nextSegment = diff[i + 1];

    if (segment.type === 'equal') {
      processedDiff.push({ type: 'match', text: segment.text });
    } else if (segment.type === 'delete') {
      // Check if this delete is followed by an insert (replacement)
      if (nextSegment && nextSegment.type === 'insert') {
        // This is a replacement - skip the delete, only show insert
        continue;
      } else {
        // Standalone delete - missing characters
        processedDiff.push({ type: 'missing', text: segment.text });
      }
    } else if (segment.type === 'insert') {
      // Wrong/extra characters
      processedDiff.push({ type: 'error', text: segment.text });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
        <div className="text-sm">
          <span className="text-gray-500">{t('diff.similarity')}: </span>
          <span className={`font-medium ${similarity >= 80 ? 'text-green-400' : similarity >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {similarity}%
          </span>
        </div>
      </div>
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 max-w-full overflow-hidden">
        <p className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
          {processedDiff.map((segment, index) => (
            <span
              key={index}
              className={`
                ${segment.type === 'match' ? 'diff-match px-0.5 rounded' : ''}
                ${segment.type === 'error' || segment.type === 'missing' ? 'diff-error px-0.5 rounded' : ''}
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

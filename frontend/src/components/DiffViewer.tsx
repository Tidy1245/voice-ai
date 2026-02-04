import type { DiffSegment } from '../types';

interface DiffViewerProps {
  diff: DiffSegment[];
}

export function DiffViewer({ diff }: DiffViewerProps) {
  if (!diff || diff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-300">Difference Comparison</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-900/50 border border-green-700" />
            <span className="text-gray-500">Added</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-900/50 border border-red-700" />
            <span className="text-gray-500">Removed</span>
          </span>
        </div>
      </div>
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
        <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {diff.map((segment, index) => (
            <span
              key={index}
              className={`
                ${segment.type === 'insert' ? 'diff-insert px-0.5 rounded' : ''}
                ${segment.type === 'delete' ? 'diff-delete px-0.5 rounded' : ''}
                ${segment.type === 'equal' ? 'diff-equal' : ''}
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

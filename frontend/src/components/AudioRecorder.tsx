import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob && !isRecording) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, isRecording, onRecordingComplete]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Recording Complete</p>
              <p className="text-sm text-gray-400">Duration: {formatDuration(duration)}</p>
            </div>
          </div>
          <button
            onClick={clearRecording}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <audio src={audioUrl} controls className="w-full h-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all
            ${isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isRecording ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-600 recording-pulse" />
            <span
              className="absolute inset-0 rounded-full bg-red-600 recording-pulse"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}
      </div>

      <div className="text-center">
        {isRecording ? (
          <>
            <p className="text-red-400 font-medium">Recording...</p>
            <p className="text-2xl font-mono text-white mt-1">{formatDuration(duration)}</p>
          </>
        ) : (
          <p className="text-gray-400">Click to start recording</p>
        )}
      </div>
    </div>
  );
}

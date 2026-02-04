import { useState, useEffect, useCallback } from 'react';
import { ModelSelector } from './components/ModelSelector';
import { AudioUploader } from './components/AudioUploader';
import { AudioRecorder } from './components/AudioRecorder';
import { TranscriptInput } from './components/TranscriptInput';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { transcribe, getModels } from './services/api';
import type { Model, ModelId, TranscriptionResult, InputMode, HistoryRecord } from './types';

const defaultModels: Model[] = [
  { id: 'faster-whisper', name: 'Faster Whisper', description: 'General multilingual speech recognition' },
  { id: 'whisper-taiwanese', name: 'Whisper Taiwanese', description: 'Optimized for Taiwanese/Mandarin' },
  { id: 'formospeech', name: 'FormoSpeech Hakka', description: 'Specialized for Hakka language' },
];

function App() {
  const [models, setModels] = useState<Model[]>(defaultModels);
  const [selectedModel, setSelectedModel] = useState<ModelId>('faster-whisper');
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    getModels()
      .then((response) => setModels(response.models))
      .catch(() => setModels(defaultModels));
  }, []);

  const handleTranscribe = async () => {
    const audio = inputMode === 'upload' ? selectedFile : recordedBlob;
    if (!audio) {
      setError('Please select or record an audio file');
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await transcribe(
        audio,
        selectedModel,
        referenceText || undefined,
        audio instanceof File ? audio.name : 'recording.webm'
      );
      setResult(response);
      setHistoryRefresh((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAudio = useCallback(() => {
    setSelectedFile(null);
    setRecordedBlob(null);
  }, []);

  const handleSelectHistory = (record: HistoryRecord) => {
    setResult({
      success: true,
      transcription: record.transcription,
      duration: record.duration,
      model_used: record.model_used,
      diff: record.diff,
      id: record.id,
    });
    if (record.reference_text) {
      setReferenceText(record.reference_text);
    }
  };

  const hasAudio = inputMode === 'upload' ? !!selectedFile : !!recordedBlob;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Voice AI</h1>
              <p className="text-sm text-gray-400">Speech Recognition System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Panel - Main Controls */}
          <div className="flex-1 space-y-6">
            {/* Model Selection */}
            <div className="card">
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
                disabled={isLoading}
              />
            </div>

            {/* Audio Input */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setInputMode('upload');
                    setRecordedBlob(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    inputMode === 'upload'
                      ? 'bg-violet-600 text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => {
                    setInputMode('record');
                    setSelectedFile(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    inputMode === 'record'
                      ? 'bg-violet-600 text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  Record Audio
                </button>
              </div>

              {inputMode === 'upload' ? (
                <AudioUploader
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  onClear={handleClearAudio}
                  disabled={isLoading}
                />
              ) : (
                <AudioRecorder onRecordingComplete={setRecordedBlob} disabled={isLoading} />
              )}
            </div>

            {/* Reference Text */}
            <div className="card">
              <TranscriptInput
                value={referenceText}
                onChange={setReferenceText}
                disabled={isLoading}
              />
            </div>

            {/* Transcribe Button */}
            <button
              onClick={handleTranscribe}
              disabled={!hasAudio || isLoading}
              className="btn-gradient w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Start Transcription
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Result */}
            <ResultDisplay result={result} isLoading={isLoading} />
          </div>

          {/* Right Panel - History */}
          <div className="w-80 flex-shrink-0">
            <div className="card h-[calc(100vh-160px)] sticky top-24">
              <HistoryPanel onSelectRecord={handleSelectHistory} refreshTrigger={historyRefresh} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

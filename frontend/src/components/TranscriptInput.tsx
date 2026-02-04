interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TranscriptInput({ value, onChange, disabled }: TranscriptInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Reference Transcript (Optional)
        </label>
        {value && (
          <button
            onClick={() => onChange('')}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter reference text to compare with transcription result..."
        rows={4}
        className="textarea-dark"
      />
      <p className="text-xs text-gray-500">
        If provided, the result will show differences between the reference and transcription.
      </p>
    </div>
  );
}

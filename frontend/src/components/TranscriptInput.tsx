import { useLanguage } from '../contexts/LanguageContext';

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TranscriptInput({ value, onChange, disabled }: TranscriptInputProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          {t('reference.title')}
        </label>
        {value && (
          <button
            onClick={() => onChange('')}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            {t('reference.clear')}
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={t('reference.placeholder')}
        rows={4}
        className="textarea-dark"
      />
      <p className="text-xs text-gray-500">
        {t('reference.hint')}
      </p>
    </div>
  );
}

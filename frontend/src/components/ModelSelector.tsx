import type { Model, ModelId } from '../types';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: ModelId;
  onSelect: (modelId: ModelId) => void;
  disabled?: boolean;
}

export function ModelSelector({ models, selectedModel, onSelect, disabled }: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Select Speech Recognition Model
      </label>
      <div className="flex flex-wrap gap-3">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelect(model.id as ModelId)}
            disabled={disabled}
            className={`
              px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm
              ${
                selectedModel === model.id
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600 border border-dark-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={model.description}
          >
            {model.name}
          </button>
        ))}
      </div>
      {models.length > 0 && (
        <p className="text-xs text-gray-500">
          {models.find((m) => m.id === selectedModel)?.description}
        </p>
      )}
    </div>
  );
}

import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1">
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          language === 'zh'
            ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}

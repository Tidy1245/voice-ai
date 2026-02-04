import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface Translations {
  [key: string]: {
    zh: string;
    en: string;
  };
}

const translations: Translations = {
  // Header
  'header.subtitle': {
    zh: '語音辨識系統',
    en: 'Speech Recognition System',
  },
  // Model Selector
  'model.select': {
    zh: '選擇語音辨識模型',
    en: 'Select Speech Recognition Model',
  },
  'model.faster-whisper.desc': {
    zh: '通用多語言語音辨識',
    en: 'General multilingual speech recognition',
  },
  'model.whisper-taiwanese.desc': {
    zh: '台灣中文優化',
    en: 'Optimized for Traditional Chinese (Taiwan)',
  },
  'model.formospeech.desc': {
    zh: '客家語專用',
    en: 'Specialized for Hakka language',
  },
  // Audio Input
  'audio.upload': {
    zh: '上傳檔案',
    en: 'Upload File',
  },
  'audio.record': {
    zh: '錄音',
    en: 'Record Audio',
  },
  'audio.drop': {
    zh: '拖放音訊檔案至此或點擊瀏覽',
    en: 'Drop audio file here or click to browse',
  },
  'audio.formats': {
    zh: '支援 WAV, MP3, M4A, WebM, OGG, FLAC',
    en: 'Supports WAV, MP3, M4A, WebM, OGG, FLAC',
  },
  'audio.recording': {
    zh: '錄音中...',
    en: 'Recording...',
  },
  'audio.clickToRecord': {
    zh: '點擊開始錄音',
    en: 'Click to start recording',
  },
  'audio.recordingComplete': {
    zh: '錄音完成',
    en: 'Recording Complete',
  },
  'audio.duration': {
    zh: '時長',
    en: 'Duration',
  },
  // Reference Text
  'reference.title': {
    zh: '參考文字稿（選填）',
    en: 'Reference Transcript (Optional)',
  },
  'reference.placeholder': {
    zh: '輸入參考文字以與辨識結果比對...',
    en: 'Enter reference text to compare with transcription result...',
  },
  'reference.hint': {
    zh: '如有提供，結果將顯示參考文字與辨識結果的差異',
    en: 'If provided, the result will show differences between the reference and transcription.',
  },
  'reference.clear': {
    zh: '清除',
    en: 'Clear',
  },
  // Transcribe Button
  'transcribe.start': {
    zh: '開始辨識',
    en: 'Start Transcription',
  },
  'transcribe.processing': {
    zh: '處理中...',
    en: 'Processing...',
  },
  // Result
  'result.title': {
    zh: '辨識結果',
    en: 'Transcription Result',
  },
  'result.copy': {
    zh: '複製',
    en: 'Copy',
  },
  'result.noSpeech': {
    zh: '未偵測到語音',
    en: 'No speech detected',
  },
  'result.processing': {
    zh: '處理音訊中...',
    en: 'Processing audio...',
  },
  'result.wait': {
    zh: '請稍候',
    en: 'This may take a moment',
  },
  // Diff
  'diff.title': {
    zh: '差異比對',
    en: 'Difference Comparison',
  },
  'diff.added': {
    zh: '新增',
    en: 'Added',
  },
  'diff.removed': {
    zh: '刪除',
    en: 'Removed',
  },
  // History
  'history.title': {
    zh: '歷史記錄',
    en: 'History',
  },
  'history.records': {
    zh: '筆記錄',
    en: 'records',
  },
  'history.empty': {
    zh: '尚無歷史記錄',
    en: 'No history yet',
  },
  'history.loadMore': {
    zh: '載入更多',
    en: 'Load more',
  },
  'history.clearAll': {
    zh: '清除全部',
    en: 'Clear All',
  },
  'history.confirmDelete': {
    zh: '確定要刪除此記錄嗎？',
    en: 'Are you sure you want to delete this record?',
  },
  'history.confirmClearAll': {
    zh: '確定要清除所有歷史記錄嗎？',
    en: 'Are you sure you want to clear all history?',
  },
  'history.ago': {
    zh: '前',
    en: 'ago',
  },
  'history.justNow': {
    zh: '剛剛',
    en: 'Just now',
  },
  // Errors
  'error.selectAudio': {
    zh: '請選擇或錄製音訊檔案',
    en: 'Please select or record an audio file',
  },
  'error.microphoneDenied': {
    zh: '無法存取麥克風，請確認已授予麥克風權限',
    en: 'Failed to access microphone. Please ensure microphone permissions are granted.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('voice-ai-language');
    return (saved as Language) || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('voice-ai-language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

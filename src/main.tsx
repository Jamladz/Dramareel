import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import App from './App.tsx';
import './index.css';

function SafeAppWrapper() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global runtime error:", event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center text-2xl font-bold mb-4 border border-red-500/30">
          ⚠️
        </div>
        <h1 className="text-xl font-bold mb-2">Drama Reel</h1>
        <p className="text-xs text-white/60 mb-6 max-w-sm">
          {errorMessage || 'حدث خطأ غير متوقع أثناء تحميل التطبيق'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-lg active:scale-95 transition-all"
        >
          إعادة تحميل التطبيق
        </button>
      </div>
    );
  }

  const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      uiPreferences={{ theme: THEME.DARK }}
    >
      <App />
    </TonConnectUIProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeAppWrapper />
  </StrictMode>,
);

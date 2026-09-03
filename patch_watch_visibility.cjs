const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

code = code.replace(
  `  const [isLongEpisodeAdPlaying, setIsLongEpisodeAdPlaying] = useState(false);`,
  `  const [isLongEpisodeAdPlaying, setIsLongEpisodeAdPlaying] = useState(false);
  const [isAppVisible, setIsAppVisible] = useState(true);

  // Handle Telegram WebApp and standard document visibility lifecycle
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsAppVisible(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Telegram WebApp specific lifecycle if needed
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.onEvent('viewportChanged', () => {
        setIsAppVisible(window.Telegram.WebApp.isExpanded || document.visibilityState === 'visible');
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);`
);

const targetReelPlayer = `forcePause={isCurrentActive && isLongEpisodeAdPlaying}`;
const newReelPlayer = `forcePause={(isCurrentActive && isLongEpisodeAdPlaying) || !isAppVisible}`;
code = code.replace(targetReelPlayer, newReelPlayer);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched watch visibility');

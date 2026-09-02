const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

// Add forcePause prop
code = code.replace(
  "interface ReelPlayerProps {\n  url: string;",
  "interface ReelPlayerProps {\n  url: string;\n  forcePause?: boolean;"
);

code = code.replace(
  "export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, shouldLoad = true, duration, onProgress, onComplete, isUIVisible }) => {",
  "export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, shouldLoad = true, duration, onProgress, onComplete, isUIVisible, forcePause }) => {"
);

const oldForcePauseLogic = `  // Synchronously update isActiveRef & reset state on inactive
  useEffect(() => {
    isActiveRef.current = isActive;`;
    
const newForcePauseLogic = `  // Handle force pause
  useEffect(() => {
    if (forcePause && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [forcePause]);

  // Synchronously update isActiveRef & reset state on inactive
  useEffect(() => {
    isActiveRef.current = isActive;`;

code = code.replace(oldForcePauseLogic, newForcePauseLogic);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer.tsx');

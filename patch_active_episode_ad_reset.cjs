const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const target = `  useEffect(() => {
    lastAdMilestoneRef.current = 0;
    setAutoPlayingNext(prev => {`;

const replacement = `  useEffect(() => {
    lastAdMilestoneRef.current = 0;
    setIsLongEpisodeAdPlaying(false);
    setAutoPlayingNext(prev => {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched active episode ad reset');

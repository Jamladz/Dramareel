const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

// Update onProgress type
code = code.replace(
  `onProgress?: (time: number) => void;`,
  `onProgress?: (time: number, videoDuration?: number) => void;`
);

// Update HTML5 onProgress call
code = code.replace(
  `    if (onProgress) {
      onProgress(video.currentTime);
    }`,
  `    if (onProgress) {
      onProgress(video.currentTime, video.duration);
    }`
);

// Update Embed onProgress call
code = code.replace(
  `        if (onProgress) onProgress(next);`,
  `        if (onProgress) onProgress(next, duration);`
);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched ReelPlayer.tsx for onProgress duration');

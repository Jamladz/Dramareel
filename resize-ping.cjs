const fs = require('fs');

let reelPlayer = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');
reelPlayer = reelPlayer.replace(/w-20 h-20 bg-black\/60 rounded-full flex items-center justify-center text-white backdrop-blur-md animate-ping/g, 'w-14 h-14 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md animate-ping');
reelPlayer = reelPlayer.replace(/<Play size=\{40\}/g, '<Play size={28}');
reelPlayer = reelPlayer.replace(/<Pause size=\{40\}/g, '<Pause size={28}');
fs.writeFileSync('src/components/ReelPlayer.tsx', reelPlayer);
console.log('done');

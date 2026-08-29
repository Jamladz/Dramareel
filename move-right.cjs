const fs = require('fs');

let watch = fs.readFileSync('src/pages/Watch.tsx', 'utf8');
watch = watch.replace(/absolute right-3\.5/g, 'absolute right-1.5');
fs.writeFileSync('src/pages/Watch.tsx', watch);

let forYou = fs.readFileSync('src/pages/ForYou.tsx', 'utf8');
forYou = forYou.replace(/absolute right-3\.5/g, 'absolute right-1.5');
fs.writeFileSync('src/pages/ForYou.tsx', forYou);

let reelPlayer = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');
reelPlayer = reelPlayer.replace(/right-3\.5 z-30 flex items-center justify-end/g, 'right-2 z-30 flex items-center justify-end');
fs.writeFileSync('src/components/ReelPlayer.tsx', reelPlayer);

console.log('done');

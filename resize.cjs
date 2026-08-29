const fs = require('fs');

let watch = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Exit button
watch = watch.replace(/w-10 h-10 bg-black\/50/g, 'w-9 h-9 bg-black/50');
watch = watch.replace(/<ArrowLeft size=\{20\}/g, '<ArrowLeft size={18}');

// Avatar
watch = watch.replace(/w-12 h-12 rounded-full p-\[2px\]/g, 'w-10 h-10 rounded-full p-[2px]');

// Like button
watch = watch.replace(/w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 border/g, 'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 border');
watch = watch.replace(/Heart size=\{24\}/g, 'Heart size={20}');

// Episodes Drawer
watch = watch.replace(/w-12 h-12 bg-black\/45 backdrop-blur-xl rounded-full/g, 'w-10 h-10 bg-black/45 backdrop-blur-xl rounded-full');
watch = watch.replace(/Layers size=\{22\}/g, 'Layers size={18}');

// Share button
watch = watch.replace(/w-12 h-12 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 rounded-full flex/g, 'w-10 h-10 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 rounded-full flex');
watch = watch.replace(/Share2 size=\{22\}/g, 'Share2 size={18}');

// Views
watch = watch.replace(/iconSize=\{26\}/g, 'iconSize={22}');
watch = watch.replace(/text-\[11px\]/g, 'text-[10px]'); // Make text smaller too

fs.writeFileSync('src/pages/Watch.tsx', watch);

let forYou = fs.readFileSync('src/pages/ForYou.tsx', 'utf8');
// Avatar
forYou = forYou.replace(/w-12 h-12 rounded-full p-\[2px\]/g, 'w-10 h-10 rounded-full p-[2px]');

// Like button
forYou = forYou.replace(/w-12 h-12 rounded-full flex items-center/g, 'w-10 h-10 rounded-full flex items-center');
forYou = forYou.replace(/Heart size=\{24\}/g, 'Heart size={20}');

// Comments button
forYou = forYou.replace(/w-12 h-12 bg-black\/45 backdrop-blur-xl rounded-full/g, 'w-10 h-10 bg-black/45 backdrop-blur-xl rounded-full');
forYou = forYou.replace(/MessageCircle size=\{22\}/g, 'MessageCircle size={18}');

// Bookmark/Save button
forYou = forYou.replace(/Bookmark size=\{22\}/g, 'Bookmark size={18}');
forYou = forYou.replace(/iconSize=\{26\}/g, 'iconSize={22}');
forYou = forYou.replace(/text-\[11px\]/g, 'text-[10px]'); 

fs.writeFileSync('src/pages/ForYou.tsx', forYou);

let reelPlayer = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');
reelPlayer = reelPlayer.replace(/w-20 h-20 rounded-full flex items-center justify-center text-white/g, 'w-14 h-14 rounded-full flex items-center justify-center text-white');
reelPlayer = reelPlayer.replace(/Pause size=\{36\}/g, 'Pause size={28}');
reelPlayer = reelPlayer.replace(/Play size=\{36\}/g, 'Play size={28}');
fs.writeFileSync('src/components/ReelPlayer.tsx', reelPlayer);
console.log('done');

const fs = require('fs');
let code = fs.readFileSync('src/components/ReelPlayer.tsx', 'utf8');

const targetNativeHls = `      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = parsed.originalUrl;
        const handleMetadata = () => {
          setIsReady(true);
          setIsBuffering(false);
        };
        video.addEventListener('loadedmetadata', handleMetadata);`;

const replacementNativeHls = `      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = parsed.originalUrl;
        setIsReady(true); // iOS Catch-22: must be ready to trigger play() which triggers load
        const handleMetadata = () => {
          setIsBuffering(false);
        };
        video.addEventListener('loadedmetadata', handleMetadata);`;

const targetNativeMp4 = `    } else {
      video.src = parsed.originalUrl;
      const handleMetadata = () => {
        setIsReady(true);
        setIsBuffering(false);
      };
      video.addEventListener('loadedmetadata', handleMetadata);`;

const replacementNativeMp4 = `    } else {
      video.src = parsed.originalUrl;
      setIsReady(true); // Mobile Catch-22
      const handleMetadata = () => {
        setIsBuffering(false);
      };
      video.addEventListener('loadedmetadata', handleMetadata);`;

code = code.replace(targetNativeHls, replacementNativeHls);
code = code.replace(targetNativeMp4, replacementNativeMp4);

fs.writeFileSync('src/components/ReelPlayer.tsx', code);
console.log('patched native ready state');

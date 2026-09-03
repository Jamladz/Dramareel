const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetIO = `    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const epId = entry.target.getAttribute('data-episode-id');
            if (epId) setActiveEpisodeId(epId);
          }
        });
      },`;

const replacementIO = `    observer.current = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const epId = entry.target.getAttribute('data-episode-id');
            if (epId) setActiveEpisodeId(epId);
          }
        });
      },`;

code = code.replace(targetIO, replacementIO);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched IO programmatic scroll');

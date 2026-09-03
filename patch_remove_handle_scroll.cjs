const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetHandleScroll = `  // Precise height-based calculation on scroll for instant active episode switching
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const height = container.clientHeight;
    if (height <= 0) return;
    const index = Math.round(container.scrollTop / height);
    if (episodes[index] && episodes[index].id !== activeEpisodeId) {
      setActiveEpisodeId(episodes[index].id);
    }
  };`;

code = code.replace(targetHandleScroll, '');

const targetOnScroll = `        onScroll={handleScroll}`;
code = code.replace(targetOnScroll, '');

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx removed handleScroll');

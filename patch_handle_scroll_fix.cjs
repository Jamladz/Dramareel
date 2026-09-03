const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetScrollRegex = /\{\/\* Vertical Scroll Container \*\/\}\s*<div\s*ref=\{containerRef\}\s*className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar touch-pan-y"\s*style=\{\{ scrollBehavior: 'smooth' \}\}/;

const replacementScroll = `  // Robust manual scroll handling
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    
    // Find the child that is most visible
    const children = Array.from(container.querySelectorAll('.reel-item'));
    let maxVisibleArea = 0;
    let mostVisibleEpId = activeEpisodeId;
    
    const containerRect = container.getBoundingClientRect();
    
    for (const child of children) {
      const rect = child.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      if (visibleHeight > maxVisibleArea) {
        maxVisibleArea = visibleHeight;
        mostVisibleEpId = child.getAttribute('data-episode-id') || activeEpisodeId;
      }
    }
    
    if (maxVisibleArea > containerRect.height * 0.4 && mostVisibleEpId !== activeEpisodeId) {
      setActiveEpisodeId(mostVisibleEpId);
    }
  };

      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar touch-pan-y"
        style={{ scrollBehavior: 'smooth' }}`;

code = code.replace(targetScrollRegex, replacementScroll);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx handleScroll fix');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Remove the injected handleScroll from JSX
const badInjectionRegex = /\s*\/\/ Robust manual scroll handling[\s\S]*?setActiveEpisodeId\(mostVisibleEpId\);\n    }\n  \};\n/;
code = code.replace(badInjectionRegex, '');

// Put handleScroll before the return statement
const returnStatementRegex = /\s*return \(\n\s*<div\s*onClick=\{handleScreenTouch\}/;
const handleScrollCode = `
  // Robust manual scroll handling
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

`;

code = code.replace(returnStatementRegex, handleScrollCode + '  return (\n    <div onClick={handleScreenTouch}');

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched JSX error');

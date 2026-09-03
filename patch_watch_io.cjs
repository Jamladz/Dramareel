const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Replace handleScroll with a better IntersectionObserver setup
const targetHandleScrollRegex = /\/\/ Robust manual scroll handling[\s\S]*?setActiveEpisodeId\(mostVisibleEpId\);\n    }\n  \};/;

const replacementObserver = `  // High-performance IntersectionObserver for immediate switching
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use a high-frequency observer to detect crossing the 40% threshold immediately
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        
        // Find the most prominent entry that crosses our threshold
        let bestEpId = null;
        let maxRatio = 0;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            if (entry.intersectionRatio > maxRatio) {
              maxRatio = entry.intersectionRatio;
              bestEpId = entry.target.getAttribute('data-episode-id');
            }
          }
        });
        
        if (bestEpId) {
          setActiveEpisodeId(bestEpId);
        }
      },
      {
        root: container,
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], // High frequency updates for instant reaction
      }
    );

    // Observe all children
    const children = Array.from(container.querySelectorAll('.reel-item'));
    children.forEach((child) => observer.observe(child));

    // Fallback: also observe DOM mutations in case elements are added late
    const mutationObserver = new MutationObserver(() => {
      const newChildren = Array.from(container.querySelectorAll('.reel-item'));
      newChildren.forEach((child) => observer.observe(child));
    });
    mutationObserver.observe(container, { childList: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [episodes]);`;

code = code.replace(targetHandleScrollRegex, replacementObserver);

// Remove onScroll={handleScroll}
code = code.replace(/onScroll=\{handleScroll\}/, '');

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx observer');

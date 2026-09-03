const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetIntersectionObserver = `  // Backup IntersectionObserver for snap scroll completion
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const epId = entry.target.getAttribute('data-episode-id');
            if (epId) setActiveEpisodeId(epId);
          }
        });
      },
      {
        root: container,
        threshold: [0.5, 0.7],
      }
    );

    const children = container.querySelectorAll('.reel-item');
    children.forEach((child) => observer.current?.observe(child));

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [episodes]);`;

code = code.replace(targetIntersectionObserver, '');

const targetScroll = `      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar touch-pan-y"
        style={{ scrollBehavior: 'smooth' }}`;

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
    
    // Only update if it covers at least 40% of the container
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

code = code.replace(targetScroll, replacementScroll);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx added robust handleScroll');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const targetScrollTo = `  // Scroll to active episode on initial load or drawer click
  const scrollToEpisode = (epId: string, smoothAdjacent = false) => {
    // ALWAYS set active immediately for smooth audio transition
    setActiveEpisodeId(epId);
    if (containerRef.current) {
      const el = containerRef.current.querySelector(\`[data-episode-id="\${epId}"]\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };`;

const replacementScrollTo = `  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to active episode on initial load or drawer click
  const scrollToEpisode = (epId: string, smoothAdjacent = false) => {
    isProgrammaticScrollRef.current = true;
    setActiveEpisodeId(epId);
    if (containerRef.current) {
      const el = containerRef.current.querySelector(\`[data-episode-id="\${epId}"]\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);
  };`;

const targetHandleScroll = `  // Precise height-based calculation on scroll for instant active episode switching
  const handleScroll = () => {
    const container = containerRef.current;`;

const replacementHandleScroll = `  // Precise height-based calculation on scroll for instant active episode switching
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;`;

code = code.replace(targetScrollTo, replacementScrollTo);
code = code.replace(targetHandleScroll, replacementHandleScroll);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx scroll conflict');

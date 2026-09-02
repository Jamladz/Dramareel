const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Move useEffect down
const badEffect = `  useEffect(() => {
    lastAdMilestoneRef.current = 0;
  }, [activeEpisodeId]);`;

code = code.replace(badEffect, "");

const activeEpisodeDecl = `  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');`;
const replacement = `  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');

  useEffect(() => {
    lastAdMilestoneRef.current = 0;
  }, [activeEpisodeId]);`;

code = code.replace(activeEpisodeDecl, replacement);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx fix');

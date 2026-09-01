const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// we have `  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');`
// let's look if it is correctly ordered.
code = code.replace(
  /if \(!movie\) \{\n      return \(\n[\s\S]*?\}\n/,
  ""
);

fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx');

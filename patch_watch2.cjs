const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const oldLine = "if (isCurrentActive && ep.isLongEpisode && !isPaidVip() && !isPointsVip()) {";
const newLine = "if (isCurrentActive && (ep.isLongEpisode || (ep.duration && ep.duration >= 1200)) && !isPaidVip() && !isPointsVip()) {";

code = code.replace(oldLine, newLine);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx for 1200');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const target = `                  onProgress={(time) => {
                    const isNearEnd = ep.duration ? (ep.duration - time < 15) : false;
                    if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (ep.duration && ep.duration >= 1200)) && !isPaidVip() && !isPointsVip()) {`;

const replacement = `                  onProgress={(time, videoDuration) => {
                    const finalDuration = videoDuration || ep.duration;
                    const isNearEnd = finalDuration ? (finalDuration - time < 15) : false;
                    if (isCurrentActive && !autoPlayingNext && !isNearEnd && (ep.isLongEpisode || (ep.duration && ep.duration >= 1200)) && !isPaidVip() && !isPointsVip()) {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Watch.tsx', code);
console.log('patched Watch.tsx onProgress parameter');

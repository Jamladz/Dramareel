const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const insertTarget = `<p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
                💡 يدعم جميع الصيغ والروابط والـ Embed: Dailymotion (geo.dailymotion), YouTube, Vimeo, MP4, M3U8, Google Drive.
              </p>
            </div>`;

const checkboxHTML = `
            {/* Long Episode Checkbox */}
            <div className="flex items-center gap-3 bg-[#161616] border border-white/10 p-3.5 rounded-2xl">
              <input
                type="checkbox"
                id="isLongEpisode"
                checked={newEpisode.isLongEpisode || false}
                onChange={e => setNewEpisode({...newEpisode, isLongEpisode: e.target.checked})}
                className="w-4 h-4 rounded bg-[#111] border-white/20 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
              />
              <label htmlFor="isLongEpisode" className="text-xs font-bold text-white/90">
                تفعيل الإعلانات كل 5 دقائق (للحلقات الطويلة أكثر من 20 دقيقة)
              </label>
            </div>
`;

if (code.includes(insertTarget)) {
  code = code.replace(insertTarget, insertTarget + "\n" + checkboxHTML);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log('patched Admin.tsx');
} else {
  console.log("Could not find insertTarget");
}

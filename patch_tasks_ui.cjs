const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

// We will reconstruct the Tasks List section to clearly separate them.
const oldTasksList = `        {/* Tasks List */}
        <div className="space-y-3">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'مهام متكررة' : 'Recurring Tasks'}
          </h3>
          
          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'شاهد إعلان Monetag' : 'Watch Monetag Ad'}
            subtitle={isArabic ? 'متاح مرة كل 24 ساعة' : 'Available once every 24h'}
            reward="100"
            actionText={isArabic ? 'مطالبة' : 'Claim'}
            onAction={handleMonetagClaim}
            disabled={!!monetagTimeLeft}
            loading={isMonetagLoading}
            completed={false}
            timer={monetagTimeLeft}
          />

          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'مكافأة إعلانات Adsgram' : 'Adsgram Ad Reward'}
            subtitle={\`\${adsWatchedCount}/\${DAILY_AD_LIMIT} \${isArabic ? 'يومياً' : 'Daily'}\`}
            reward="100"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleRewardAd}
            disabled={adsWatchedCount >= DAILY_AD_LIMIT}
            loading={isRewardAdLoading}
            completed={adsWatchedCount >= DAILY_AD_LIMIT}
          />

          <TaskItem 
            icon={<Film size={20} />}
            title={isArabic ? 'مشاهدة إعلان سريع' : 'Watch Quick Ad'}
            subtitle={isArabic ? 'متاح باستمرار' : 'Always available'}
            reward="30"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleWatchAd}
            disabled={isWatchingAd}
            loading={isWatchingAd}
            completed={false}
          />
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'مهام لمرة واحدة' : 'One-time Tasks'}
          </h3>`;

const newTasksList = `        {/* Monetag Tasks */}
        <div className="space-y-3">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'اعلانات Monetag' : 'Monetag Ads'}
          </h3>
          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'شاهد إعلان Monetag' : 'Watch Monetag Ad'}
            subtitle={isArabic ? 'متاح مرة كل 24 ساعة' : 'Available once every 24h'}
            reward="100"
            actionText={isArabic ? 'مطالبة' : 'Claim'}
            onAction={handleMonetagClaim}
            disabled={!!monetagTimeLeft}
            loading={isMonetagLoading}
            completed={false}
            timer={monetagTimeLeft}
          />
        </div>

        {/* Adsgram Tasks */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'اعلانات Adsgram' : 'Adsgram Ads'}
          </h3>
          <TaskItem 
            icon={<Tv size={20} />}
            title={isArabic ? 'مكافأة إعلانات Adsgram' : 'Adsgram Ad Reward'}
            subtitle={\`\${adsWatchedCount}/\${DAILY_AD_LIMIT} \${isArabic ? 'يومياً' : 'Daily'}\`}
            reward="100"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleRewardAd}
            disabled={adsWatchedCount >= DAILY_AD_LIMIT}
            loading={isRewardAdLoading}
            completed={adsWatchedCount >= DAILY_AD_LIMIT}
          />

          <TaskItem 
            icon={<Film size={20} />}
            title={isArabic ? 'مشاهدة إعلان سريع' : 'Watch Quick Ad'}
            subtitle={isArabic ? 'متاح باستمرار' : 'Always available'}
            reward="30"
            actionText={isArabic ? 'مشاهدة' : 'Watch'}
            onAction={handleWatchAd}
            disabled={isWatchingAd}
            loading={isWatchingAd}
            completed={false}
          />
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm text-white/50 font-bold uppercase tracking-wider px-1">
            {isArabic ? 'مهام أخرى' : 'Other Tasks'}
          </h3>`;

code = code.replace(oldTasksList, newTasksList);
fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx UI');

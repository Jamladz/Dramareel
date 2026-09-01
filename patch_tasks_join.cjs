const fs = require('fs');
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const oldHandleJoin = /const handleJoinTelegram = \(\) => \{[\s\S]*?\}, 2000\);\s*\};/;
const newHandleJoin = `const handleJoinTelegram = () => {
    if (hasJoinedTelegram) return;
    window.open('https://t.me/dramareel2026', '_blank');
    
    setTimeout(async () => {
      const uid = getCurrentUserId();
      if (uid) {
        const res = await completeTelegramTask(uid, 'join_channel', 100);
        if (res.success) {
          setJoinedTelegram();
          addCoins(100, 'انضمام لقناة التلجرام');
          alert(isArabic ? '🎉 تم إكمال المهمة بنجاح!' : '🎉 Task completed!');
        } else {
          if (res.error === 'Task already completed') {
            setJoinedTelegram();
            alert(isArabic ? 'لقد أكملت هذه المهمة مسبقاً' : 'Task already completed');
          }
        }
      } else {
         setJoinedTelegram();
         addCoins(100, 'انضمام لقناة التلجرام');
      }
    }, 5000);
  };`;

code = code.replace(oldHandleJoin, newHandleJoin);
fs.writeFileSync('src/pages/Tasks.tsx', code);
console.log('patched Tasks.tsx join channel');

const fs = require('fs');
let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

const oldButton = /<button \s*onClick=\{\(\) => \{\s*window\.open\('https:\/\/t\.me\/dramareel2026', '_blank'\);\s*setTimeout\(\(\) => \{\s*useAppStore\.getState\(\)\.setJoinedTelegram\(\);\s*useAppStore\.getState\(\)\.addCoins\(100, 'انضمام لقناة التلجرام'\);\s*\}, 2000\);\s*\}\}[\s\S]*?<\/button>/;

const newButton = `<button 
                    onClick={async () => {
                      window.open('https://t.me/dramareel2026', '_blank');
                      setMsg({ text: isArabic ? 'جاري التحقق من الانضمام...' : 'Verifying join...', success: true });
                      setTimeout(async () => {
                        const uid = getCurrentUserId();
                        if (uid) {
                          const res = await completeTelegramTask(uid, 'join_channel', 100);
                          if (res.success) {
                            useAppStore.getState().setJoinedTelegram();
                            useAppStore.getState().addCoins(100, 'انضمام لقناة التلجرام');
                            setMsg({ text: isArabic ? '🎉 تم إكمال المهمة بنجاح!' : '🎉 Task completed!', success: true });
                          } else {
                            if (res.error === 'Task already completed') {
                              useAppStore.getState().setJoinedTelegram();
                              setMsg({ text: isArabic ? 'لقد أكملت هذه المهمة مسبقاً' : 'Task already completed', success: false });
                            } else {
                              setMsg({ text: isArabic ? 'حدث خطأ' : 'Error occurred', success: false });
                            }
                          }
                        } else {
                          useAppStore.getState().setJoinedTelegram();
                          useAppStore.getState().addCoins(100, 'انضمام لقناة التلجرام');
                        }
                      }, 5000);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-black px-4 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                  >
                    {isArabic ? 'انضمام' : 'Join'}
                  </button>`;

code = code.replace(oldButton, newButton);
fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('patched join channel button in PointsStoreModal');

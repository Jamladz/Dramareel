const fs = require('fs');

let adsgramCode = `// Adsgram Telegram Ad Controller Service
declare global {
  interface Window {
    Adsgram?: {
      init: (params: { blockId: string; debug?: boolean }) => {
        show: () => Promise<{ done: boolean; description: string; state: string }>;
      };
    };
  }
}

// ضع_BLOCK_ID_هنا
export const ADSGRAM_BLOCK_ID = "ضع_BLOCK_ID_هنا";

export const ADSGRAM_BLOCKS = {
  EPISODE_REWARD: 'int-39490', // Adsgram Ad for episode unlock
  DAILY_STREAK: 'int-39489',   // Adsgram Ad for Daily Attendance reward
  WATCH_AD: 'int-39490',       // Old block
  REWARD_AD: ADSGRAM_BLOCK_ID, // New Reward Block
};

export async function showAdsgramAd(blockId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Adsgram) {
      try {
        const AdController = window.Adsgram.init({ blockId, debug: false });
        AdController.show()
          .then((result) => {
            console.log('Adsgram Ad completed:', result);
            resolve(true);
          })
          .catch((err) => {
            console.warn('Adsgram Ad skipped or error:', err);
            // Must return false if skipped or error for the Reward Ad to not grant points!
            resolve(false);
          });
      } catch (e) {
        console.error('Adsgram Init Exception:', e);
        resolve(false);
      }
    } else {
      console.warn('Adsgram SDK not detected on window.');
      resolve(false);
    }
  });
}
`;

fs.writeFileSync('src/services/adsgramService.ts', adsgramCode);
console.log('patched adsgramService');

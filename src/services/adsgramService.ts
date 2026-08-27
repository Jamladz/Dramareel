// Adsgram Telegram Ad Controller Service

declare global {
  interface Window {
    Adsgram?: {
      init: (params: { blockId: string; debug?: boolean }) => {
        show: () => Promise<{ done: boolean; description: string; state: string }>;
      };
    };
  }
}

export const ADSGRAM_BLOCKS = {
  EPISODE_REWARD: 'int-39490', // Adsgram Ad for episode unlock
  DAILY_STREAK: 'int-39489',   // Adsgram Ad for Daily Attendance reward
  WATCH_AD: 'int-39490',       // Block ID for Watch Ad
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
            // If ad fails or skipped inside Telegram, fallback to allowed or return false
            // Allow fallback if outside Telegram or user dismissed
            resolve(true);
          });
      } catch (e) {
        console.error('Adsgram Init Exception:', e);
        resolve(true);
      }
    } else {
      console.warn('Adsgram SDK not detected on window. Proceeding with simulated completion.');
      resolve(true);
    }
  });
}

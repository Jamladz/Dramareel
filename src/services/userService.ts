import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export async function getTelegramUsers() {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('coins', 'desc')
    );
    const snap = await getDocs(q);
    const users: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.id && data.id.startsWith('tg_')) {
        users.push(data);
      }
    });
    return users;
  } catch (error) {
    console.error('Error fetching telegram users:', error);
    return [];
  }
}

export async function syncCoinsToFirebase(userId: string, coins: number, name?: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: userId,
        name: name || 'مستخدم',
        coins: coins,
        referralsCount: 0,
        earnedReferralCoins: 0,
        claimedMilestones: [],
        createdAt: Date.now()
      });
    } else {
      await updateDoc(userRef, { coins });
    }
  } catch (error) {
    console.error('Error syncing coins to firebase:', error);
  }
}

export async function getTaskStatus(userId: string, taskId: string): Promise<boolean> {
  try {
    if (!userId || !taskId) return false;
    const taskRef = doc(db, 'user_tasks', `${userId}_${taskId}`);
    const snap = await getDoc(taskRef);
    return snap.exists() && snap.data().completed === true;
  } catch (error) {
    console.error('Error getting task status:', error);
    return false;
  }
}

export async function completeTelegramTask(userId: string, taskId: string, reward: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || !taskId) return { success: false, error: 'Invalid data' };

    const taskRef = doc(db, 'user_tasks', `${userId}_${taskId}`);
    const userRef = doc(db, 'users', userId);

    const result = await runTransaction(db, async (transaction) => {
      // 1. ALL READS FIRST
      const taskSnap = await transaction.get(taskRef);
      if (taskSnap.exists() && taskSnap.data().completed) {
        throw new Error('Task already completed');
      }

      const userSnap = await transaction.get(userRef);

      // 2. ALL WRITES SECOND
      transaction.set(taskRef, {
        user_id: userId,
        task_id: taskId,
        task_type: 'telegram_home_screen',
        reward: reward,
        completed: true,
        completed_at: Date.now()
      });

      if (userSnap.exists()) {
        const currentCoins = userSnap.data().coins || 0;
        transaction.update(userRef, { coins: currentCoins + reward });
      } else {
        transaction.set(userRef, {
          id: userId,
          coins: reward,
          createdAt: Date.now()
        }, { merge: true });
      }

      return true;
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error completing task:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserData(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function claimMonetagReward(userId: string): Promise<{ success: boolean; newTotal?: number; lastClaim?: number; remainingMs?: number; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Invalid data' };
    const userRef = doc(db, 'users', userId);
    
    const REWARD = 100;
    const COOLDOWN_MS = 5 * 60 * 1000;
    const now = Date.now();

    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const data = userSnap.data();
      const currentCoins = data.coins || 0;
      const lastClaim = data.lastMonetagClaim || 0;

      if (now - lastClaim < COOLDOWN_MS) {
        return { 
          success: false, 
          remainingMs: COOLDOWN_MS - (now - lastClaim) 
        };
      }

      const newTotal = currentCoins + REWARD;
      transaction.update(userRef, { 
        coins: newTotal,
        lastMonetagClaim: now
      });

      return { success: true, newTotal, lastClaim: now };
    });
  } catch (error: any) {
    console.error('Error claiming monetag:', error);
    return { success: false, error: error.message };
  }
}

export async function claimSiteVisitReward(userId: string): Promise<{ success: boolean; newTotal?: number; lastClaim?: number; remainingMs?: number; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Invalid data' };
    const userRef = doc(db, 'users', userId);
    
    const REWARD = 50;
    const COOLDOWN_MS = 5 * 60 * 1000;
    const now = Date.now();

    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const data = userSnap.data();
      const currentCoins = data.coins || 0;
      const lastClaim = data.lastSiteVisitClaim || 0;

      if (now - lastClaim < COOLDOWN_MS) {
        return { 
          success: false, 
          remainingMs: COOLDOWN_MS - (now - lastClaim) 
        };
      }

      const newTotal = currentCoins + REWARD;
      transaction.update(userRef, { 
        coins: newTotal,
        lastSiteVisitClaim: now
      });

      return { success: true, newTotal, lastClaim: now };
    });
  } catch (error: any) {
    console.error('Error claiming site visit:', error);
    return { success: false, error: error.message };
  }
}

export async function claimHomeScreenReward(userId: string): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Invalid data' };
    const userRef = doc(db, 'users', userId);
    const REWARD = 100;

    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const data = userSnap.data();
      if (data.homeScreenAdded) {
        return { success: false, error: 'Already added' };
      }

      const currentCoins = data.coins || 0;
      const newTotal = currentCoins + REWARD;
      
      transaction.update(userRef, { 
        coins: newTotal,
        homeScreenAdded: true
      });

      return { success: true, newTotal };
    });
  } catch (error: any) {
    console.error('Error claiming home screen reward:', error);
    return { success: false, error: error.message };
  }
}


export async function claimRewardAd(userId: string): Promise<{ success: boolean; newTotal?: number; adsWatchedToday?: number; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Invalid data' };
    const userRef = doc(db, 'users', userId);
    const REWARD = 30;
    const DAILY_LIMIT = 20;

    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const data = userSnap.data();
      const currentCoins = data.coins || 0;
      
      const todayStr = new Date().toISOString().split('T')[0];
      let adsWatchedToday = data.adsWatchedToday || 0;
      let dailyAdsDate = data.dailyAdsDate || '';

      if (dailyAdsDate !== todayStr) {
        adsWatchedToday = 0;
        dailyAdsDate = todayStr;
      }

      if (adsWatchedToday >= DAILY_LIMIT) {
         return { success: false, error: 'Daily limit reached' };
      }

      const newTotal = currentCoins + REWARD;
      adsWatchedToday += 1;
      
      transaction.update(userRef, { 
        coins: newTotal,
        adsWatchedToday: adsWatchedToday,
        dailyAdsDate: dailyAdsDate
      });

      return { success: true, newTotal, adsWatchedToday };
    });
  } catch (error: any) {
    console.error('Error claiming reward ad:', error);
    return { success: false, error: error.message };
  }
}

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

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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

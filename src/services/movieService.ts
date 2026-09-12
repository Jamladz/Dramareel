import { collection, getDocs, query, where, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Movie, Episode } from '../types';

const COLLECTION_NAME = 'movies';

export const fetchMoviesFromDB = async (): Promise<Movie[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => doc.data() as Movie);
};

export const addMovieToDB = async (movie: Movie) => {
  await setDoc(doc(db, COLLECTION_NAME, movie.id), movie);
};

export const updateMovieInDB = async (movie: Movie) => {
  await setDoc(doc(db, COLLECTION_NAME, movie.id), movie, { merge: true });
};

export const deleteMovieFromDB = async (movieId: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, movieId));
};

export const addEpisodeToMovieDB = async (movieId: string, episode: Episode) => {
  const movieRef = doc(db, COLLECTION_NAME, movieId);
  await updateDoc(movieRef, {
    episodes: arrayUnion(episode)
  });
};

export const deleteEpisodeFromMovieDB = async (movieId: string, episode: Episode) => {
  const movieRef = doc(db, COLLECTION_NAME, movieId);
  await updateDoc(movieRef, {
    episodes: arrayRemove(episode)
  });
};

export const getNotificationStats = async (movieId: string) => {
  try {
    const notifsRef = collection(db, 'notifications');
    const [sentSnap, failedSnap, blockedSnap] = await Promise.all([
      getCountFromServer(query(notifsRef, where('movieId', '==', movieId), where('status', '==', 'sent'))),
      getCountFromServer(query(notifsRef, where('movieId', '==', movieId), where('status', '==', 'failed'))),
      getCountFromServer(query(notifsRef, where('movieId', '==', movieId), where('status', '==', 'blocked')))
    ]);
    
    return {
      sent: sentSnap.data().count,
      failed: failedSnap.data().count,
      blocked: blockedSnap.data().count
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { sent: 0, failed: 0, blocked: 0 };
  }
};

export const triggerMovieNotification = async (movie: Movie) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No admin user found to trigger notification');
      return false;
    }
    
    const token = await user.getIdToken();
    const workerUrl = (import.meta as any).env.VITE_WORKER_URL || 'https://dramareel-notifier.sekanedrmessaif.workers.dev/notify';
    
    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        movieId: movie.id,
        movieTitle: movie.title,
        movieDescription: movie.description,
        movieImage: movie.coverImage,
        adminToken: token
      })
    });
    
    return res.ok;
  } catch (error) {
    console.error('Error triggering notification:', error);
    return false;
  }
};

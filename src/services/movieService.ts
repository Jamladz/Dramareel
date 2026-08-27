import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
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

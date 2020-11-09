import firebase from 'firebase/app';

export type Publisher = {
  id?: string;
  name: string;
  nameReading: string | null;
  website: string | null;
  createdAt: firebase.firestore.Timestamp | null;
  updatedAt: firebase.firestore.Timestamp | null;
}

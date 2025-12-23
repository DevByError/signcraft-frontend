import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebaseService';

export interface ScreenDocument {
  id: string;
  screenId: string;
  userId: string;
  userEmail: string;
  name: string;
  location: string;
  resolution: string;
  status: 'online' | 'offline';
  lastSeen: Timestamp;
  ipAddress: string;
  playlistId?: string;
  playlistName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const SCREENS_COLLECTION = 'screens';
const getCurrentUser = () => ({ uid: 'guest-user-123', email: 'guest@signcraft.com' });

export const createScreen = async (name: string, location: string, res: string = '1920x1080', ip: string = '', pId?: string) => {
  try {
    const user = getCurrentUser();
    const docRef = await addDoc(collection(db, SCREENS_COLLECTION), {
      screenId: `scr${Math.floor(Math.random() * 1000)}`, // Simplified for logic check
      userId: user.uid,
      userEmail: user.email,
      name, location, resolution: res, ipAddress: ip,
      status: 'offline',
      lastSeen: Timestamp.now(),
      playlistId: pId || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, screenId: docRef.id };
  } catch (error: any) { return { success: false, error: error.message }; }
};

export const getUserScreens = async (limitNum: number = 100): Promise<ScreenDocument[]> => {
  const q = query(collection(db, SCREENS_COLLECTION), where('userId', '==', getCurrentUser().uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScreenDocument[];
};

export const updateScreenStatus = async (id: string, status: 'online' | 'offline') => {
  try {
    const docRef = doc(db, SCREENS_COLLECTION, id);
    await updateDoc(docRef, { status, lastSeen: Timestamp.now() });
    return { success: true };
  } catch (e) { return { success: false }; }
};

export const deleteScreen = async (id: string) => {
  try {
    await deleteDoc(doc(db, SCREENS_COLLECTION, id));
    return { success: true };
  } catch (e) { return { success: false }; }
};
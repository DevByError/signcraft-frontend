// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || "",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.warn('Missing Firebase config keys:', missingKeys);
  }
};

validateFirebaseConfig();

// Initialize Firebase (only once)
let app: any = null;
let initialized = false;

const initializeFirebase = () => {
  if (!initialized && !app) {
    app = initializeApp(firebaseConfig);
    initialized = true;
  }
  return app;
};

const firebaseApp = initializeFirebase();

// Initialize Analytics
try {
  getAnalytics(firebaseApp);
} catch (error) {
  console.warn('Analytics not available:', error);
}

// Export Firebase services for use throughout the app
// Note: Authentication is disabled - using guest user mode
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

export default firebaseApp;

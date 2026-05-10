// Firebase configuration for AIRIS app
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDD2mVE8-c8eAgSLX1S9cOFLfBrSPnR46s",
  authDomain: "airis-app-ee1dc.firebaseapp.com",
  databaseURL: "https://airis-app-ee1dc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "airis-app-ee1dc",
  storageBucket: "airis-app-ee1dc.firebasestorage.app",
  messagingSenderId: "545345395915",
  appId: "1:545345395915:web:6e5adcf082f9a30e538f4e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Helper functions for the app
export const fbGet = async (key) => {
  try {
    const snapshot = await get(ref(db, key));
    if (snapshot.exists()) {
      return { value: JSON.stringify(snapshot.val()) };
    }
    return null;
  } catch (e) {
    console.error("Firebase get error:", e);
    return null;
  }
};

export const fbSet = async (key, value) => {
  try {
    await set(ref(db, key), JSON.parse(value));
    return true;
  } catch (e) {
    console.error("Firebase set error:", e);
    return false;
  }
};

export const fbDelete = async (key) => {
  try {
    await remove(ref(db, key));
    return true;
  } catch (e) {
    console.error("Firebase delete error:", e);
    return false;
  }
};

export const fbListen = (key, callback) => {
  const dbRef = ref(db, key);
  return onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

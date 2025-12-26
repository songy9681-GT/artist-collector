
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configured with provided keys
const firebaseConfig = {
  apiKey: "AIzaSyCJH-SgXKpd0htFD2jdhL3ElEe6pxYMA8Q",
  authDomain: "artist-collector-cdf05.firebaseapp.com",
  projectId: "artist-collector-cdf05",
  storageBucket: "artist-collector-cdf05.firebasestorage.app",
  messagingSenderId: "339527257492",
  appId: "1:339527257492:web:d86854281d350748c69381",
  measurementId: "G-PJEMJCLJPK"
};

let app;
let auth;
let db;
let googleProvider;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  
  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    
    // Initialize Analytics only if supported environment
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn("Firebase Analytics not supported in this environment.");
    }

    // Attempt to enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firebase persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firebase persistence not supported in this browser');
      }
    });

    console.log("Firebase initialized successfully");
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

export const signIn = async () => {
  if (!auth) {
    console.error("Firebase Auth not initialized. Using Demo User.");
    return createDemoUser();
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Login failed:", error.code, error.message);
    
    // Fallback for prototype if configuration is missing or domain unauthorized
    if (error.code === 'auth/configuration-not-found' || 
        error.code === 'auth/operation-not-allowed' ||
        error.code === 'auth/unauthorized-domain' || 
        error.code === 'auth/popup-closed-by-user') {
       
       if (error.code !== 'auth/popup-closed-by-user') {
         alert(`Firebase Auth Error: ${error.code}\n\nGoogle Sign-In is likely not enabled in the Firebase Console. Logging you in with a DEMO account for testing.`);
       }
       
       if (error.code === 'auth/popup-closed-by-user') return null;

       return createDemoUser();
    }
    return null;
  }
};

const createDemoUser = () => ({
  uid: 'demo-user-123',
  displayName: 'Demo Curator',
  email: 'curator@memphis.art',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Curator'
});

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Logout error (might be demo user)", e);
  }
};

export const syncUserData = async (uid: string, data: any) => {
  if (!db || uid === 'demo-user-123') return; // Don't sync demo user
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
  } catch (e) {
    console.error("Error syncing data:", e);
  }
};

export const fetchUserData = async (uid: string) => {
  if (!db || uid === 'demo-user-123') return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching data:", e);
  }
  return null;
};

export { auth };

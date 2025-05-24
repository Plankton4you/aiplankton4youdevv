import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { apiRequest } from "./queryClient";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase initialized with project:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Login with Google
export const loginWithGoogle = async () => {
  try {
    console.log("Attempting Google sign in...");
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("Google sign in successful:", user.email);
    
    // Create or update user in the backend
    if (user) {
      await registerUserInBackend(user);
    }
    
    return user;
  } catch (error) {
    console.error("Error during Google sign in:", error);
    throw error;
  }
};

// Register user in the backend
const registerUserInBackend = async (user: User) => {
  try {
    // Get the ID token
    const token = await user.getIdToken();
    console.log("Registering Firebase user with backend...");
    
    // Send to the backend
    const response = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: user.uid,
        email: user.email || '',
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: user.photoURL || ''
      })
    });
    
    if (!response.ok) {
      console.error('Failed to register user in backend', await response.text());
    } else {
      console.log("User registered successfully with backend");
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to register user in backend:", error);
    // We don't throw here because we still want the login to succeed
  }
};

// Listen for auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log("Setting up Firebase auth state listener");
  return onAuthStateChanged(auth, callback);
};

// Logout
export const logout = async () => {
  try {
    console.log("Logging out from Firebase");
    await auth.signOut();
    console.log("Logged out successfully");
    
    // Also log out from the backend
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (e) {
      console.error("Error logging out from backend:", e);
      // Continue anyway as Firebase logout was successful
    }
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};
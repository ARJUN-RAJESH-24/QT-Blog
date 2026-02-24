/* 
 * Tech Blog - Firebase Configuration
 * User must replace these values with their own from Firebase Console
 */

const firebaseConfig = {
  apiKey: "AIzaSyBVIVluFwRt8utWuOyDUCeGkKF60NyJoIw",
  authDomain: "quick-tech-blog.firebaseapp.com",
  projectId: "quick-tech-blog",
  storageBucket: "quick-tech-blog.firebasestorage.app",
  messagingSenderId: "789088455022",
  appId: "1:789088455022:web:937cdd77f2e5576e2bd97f",
  version: "2"
};

// Initialize Firebase (Conditional check to prevent errors if SDK not loaded)
let app;
let db;

if (typeof firebase !== 'undefined') {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  console.log("Firebase initialized");
} else {
  console.warn("Firebase SDK not loaded. Running in local mock mode.");
}

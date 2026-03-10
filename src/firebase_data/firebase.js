
// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5B2b4qokO8xgsHDskCzkr_NPfpg98ais",
    authDomain: "food-app-1a551.firebaseapp.com",
    projectId: "food-app-1a551",
    storageBucket: "food-app-1a551.firebasestorage.app",
    messagingSenderId: "50589093889",
    appId: "1:50589093889:web:2c7ad354390b9eae807000",
    measurementId: "G-2BTTC5S508"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

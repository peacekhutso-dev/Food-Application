// src/firebase_data/auth.js

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./firebase";

// ---------------------------
// CREATE ACCOUNT
// ---------------------------
export const signUpUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, message: "Account created successfully!" };
  } catch (error) {
    return { error: error.message };
  }
};

// ---------------------------
// LOGIN USER
// ---------------------------
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, message: "Login successful!" };
  } catch (error) {
    return { error: error.message };
  }
};

// ---------------------------
// LOGOUT USER
// ---------------------------
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { message: "Logged out successfully!" };
  } catch (error) {
    return { error: error.message };
  }
};

// ---------------------------
// AUTH STATE CHECK
// ---------------------------
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

// ---------------------------
// ROUTE PROTECTION
// ---------------------------
export const requireAuth = async (navigate) => {
  const user = await getCurrentUser();
  if (!user) {
    navigate("/auth"); // redirect to login/signup if not authenticated
    return null;
  }
  return user;
};

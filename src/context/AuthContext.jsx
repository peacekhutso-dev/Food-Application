// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase_data/firebase';
import KanteenLoader from '../components/KanteenLoader';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userDetails,  setUserDetails]  = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    let unsubscribeUserData;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);

          if (user) {
            const userRef = doc(db, 'users', user.uid);
            unsubscribeUserData = onSnapshot(
              userRef,
              (userSnap) => {
                setUserDetails(userSnap.exists() ? userSnap.data() : null);
              },
              (error) => {
                console.error('Error listening to user data:', error);
              }
            );
          } else {
            setUserDetails(null);
          }

          setLoading(false);
        });

        return () => {
          unsubscribeAuth();
          if (unsubscribeUserData) unsubscribeUserData();
        };
      })
      .catch((error) => {
        console.error('Error setting persistence:', error);
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email, password, name, phone) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phone,
        avatar: null,
        createdAt: new Date(),
        favorites: { restaurants: [], foods: [] },
        paymentMethods: [],
        cart: []
      });

      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserDetails(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userDetails,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show branded loader while Firebase resolves auth state,
          then render the app — guests and logged-in users both pass through */}
      {loading ? <KanteenLoader /> : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
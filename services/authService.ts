// services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';
import { storageService } from './storageService';

export const authService = {
  // Check if username already exists
  checkUsernameExists: async (username: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  },

  // Register new user
  registerUser: async (
    username: string,
    email: string,
    password: string
  ): Promise<User> => {
    try {
      console.log('1. Starting registration...');
      
      // Validate username
      if (username.length < 3) {
        throw new Error('Username harus minimal 3 karakter');
      }
      if (/\s/.test(username)) {
        throw new Error('Username tidak boleh mengandung spasi');
      }

      console.log('2. Skipping username check (Firestore disabled)...');
      // TODO: Re-enable when Firestore is fixed
      // const usernameExists = await authService.checkUsernameExists(username);
      // if (usernameExists) {
      //   throw new Error('Username sudah digunakan');
      // }

      console.log('3. Creating Firebase Auth user...');
      // Create user in Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log('4. Creating user data...');
      // Create user document in Firestore
      const userData: User = {
        uid: userCredential.user.uid,
        email: email,
        username: username.toLowerCase(),
        createdAt: new Date(),
      };

      console.log('5. Skipping Firestore save (will implement later)...');
      // TODO: Fix Firestore connection issue
      // await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      console.log('6. Registration complete!');
      return userData;
    } catch (error: any) {
      console.error('Error registering user:', error);
      // Handle Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email sudah terdaftar');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email tidak valid');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password terlalu lemah (minimal 6 karakter)');
      }
      throw error;
    }
  },

  // Login user
  loginUser: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user data from auth (Firestore disabled)
      const userData: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        username: email.split('@')[0], // Use email prefix as username
        createdAt: new Date(),
      };

      return userData;
    } catch (error: any) {
      console.error('Error logging in:', error);
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email tidak terdaftar');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Password salah');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email tidak valid');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Email atau password salah');
      }
      throw error;
    }
  },

  // Auto login disabled temporarily
  autoLogin: async (): Promise<User | null> => {
    return null;
  },

  // Logout user
  logoutUser: async (): Promise<void> => {
    try {
      await signOut(auth);
      await storageService.clearAll();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  // Get current user data
  getCurrentUserData: async (): Promise<User | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
};
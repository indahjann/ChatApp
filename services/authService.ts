// services/authService.ts (Phase 1 - Fixed)
import { UserCredential } from 'firebase/auth';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from '../firebase';
import { User } from '../types';
import { storageService } from './storageService';

export const authService = {
  // Check if username already exists in Firestore
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

  // Get email from username (for login)
  getEmailFromUsername: async (username: string): Promise<string | null> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      return userDoc.data().email;
    } catch (error) {
      console.error('Error getting email from username:', error);
      return null;
    }
  },

  // Register new user
  registerUser: async (
    username: string,
    email: string,
    password: string
  ): Promise<User> => {
    try {
      console.log('1. Validating username...');

      // Validate username
      if (username.length < 3) {
        throw new Error('Username harus minimal 3 karakter');
      }
      if (/\s/.test(username)) {
        throw new Error('Username tidak boleh mengandung spasi');
      }

      console.log('2. Checking username availability...');

      // Check if username exists
      const usernameExists = await authService.checkUsernameExists(username);
      if (usernameExists) {
        throw new Error('Username sudah digunakan');
      }

      console.log('3. Creating Firebase Auth user...');

      // Create user in Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log('4. Creating user document in Firestore...');

      // Create user document in Firestore
      const userData: User = {
        uid: userCredential.user.uid,
        email: email,
        username: username.toLowerCase(),
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      console.log('5. Saving credentials for auto-login...');

      // Save credentials for auto-login
      await storageService.saveUserCredentials(email, password);
      await storageService.saveUserData(userData);

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

  // Login user with username OR email
  loginUser: async (usernameOrEmail: string, password: string): Promise<User> => {
    try {
      let email = usernameOrEmail;

      console.log('1. Checking if input is username or email...');

      // Check if input is username (no @ symbol) or email
      if (!usernameOrEmail.includes('@')) {
        console.log('2. Input detected as username, looking up email...');

        // Input is username, get email from Firestore
        const foundEmail = await authService.getEmailFromUsername(usernameOrEmail);

        if (!foundEmail) {
          throw new Error('Username tidak ditemukan');
        }

        email = foundEmail;
        console.log('3. Found email for username');
      }

      console.log('4. Authenticating with Firebase Auth...');

      // Login with email
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log('5. Loading user data from Firestore...');

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        throw new Error('Data user tidak ditemukan');
      }

      const userData = userDoc.data() as User;

      console.log('6. Saving credentials for auto-login...');

      // Save credentials for auto-login
      await storageService.saveUserCredentials(email, password);
      await storageService.saveUserData(userData);

      console.log('7. Login successful!');
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
        throw new Error('Username/Email atau password salah');
      }

      throw error;
    }
  },

  // Auto login with saved credentials
  autoLogin: async (): Promise<User | null> => {
    try {
      const credentials = await storageService.getUserCredentials();

      if (!credentials) {
        console.log('No saved credentials found');
        return null;
      }

      console.log('Attempting auto-login with saved credentials...');
      const userData = await authService.loginUser(credentials.email, credentials.password);
      console.log('Auto-login successful!');
      return userData;
    } catch (error) {
      console.error('Auto-login failed:', error);

      // Clear invalid credentials
      try {
        await storageService.clearAll();
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError);
      }

      return null;
    }
  },

  // Logout user
  logoutUser: async (): Promise<void> => {
    try {
      await signOut(auth);
      await storageService.clearAll();
      console.log('Logout successful');
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
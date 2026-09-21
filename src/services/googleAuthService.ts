import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with requested Google Drive scopes
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if sign-in is in progress
let isSigningIn = false;

// IN-MEMORY cached access token (strictly NOT stored in localStorage or sessionStorage per security mandates)
let cachedAccessToken: string | null = null;
let cachedFirebaseUser: FirebaseUser | null = null;

// Auth state listeners
type AuthListener = (user: FirebaseUser | null, token: string | null) => void;
const authListeners: Set<AuthListener> = new Set();

export const subscribeAuth = (listener: AuthListener) => {
  authListeners.add(listener);
  listener(cachedFirebaseUser, cachedAccessToken);
  return () => {
    authListeners.delete(listener);
  };
};

const notifyListeners = () => {
  authListeners.forEach((listener) => {
    listener(cachedFirebaseUser, cachedAccessToken);
  });
};

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  cachedFirebaseUser = user;
  if (!user) {
    cachedAccessToken = null;
  }
  notifyListeners();
});

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user) => {
    cachedFirebaseUser = user;
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
    notifyListeners();
  });
};

export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari autentikasi Google');
    }

    cachedAccessToken = credential.accessToken;
    cachedFirebaseUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // Handle user-initiated cancellation or popup closed gracefully
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/user-cancelled' ||
      errorMsg.includes('popup-closed-by-user') ||
      errorMsg.includes('cancelled-popup-request')
    ) {
      // User dismissed or closed the sign-in popup - return null cleanly
      return null;
    }

    if (
      errorCode === 'auth/popup-blocked' ||
      errorMsg.includes('popup-blocked')
    ) {
      throw new Error(
        'Jendela masuk diblokir oleh peramban atau pengaturan browser. Silakan izinkan pop-up untuk situs ini.'
      );
    }

    console.warn('Google sign-in exception:', errorMsg || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getGoogleUser = (): FirebaseUser | null => {
  return cachedFirebaseUser;
};

export const isGoogleConnected = (): boolean => {
  return Boolean(cachedAccessToken && cachedFirebaseUser);
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedFirebaseUser = null;
  notifyListeners();
};

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const WEB_CLIENT_ID = '1036838897395-0sv30cvc2608k653uchk171jd1dafii8.apps.googleusercontent.com';

// Configure GoogleSignin
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: true,
});

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
}

/**
 * Sign in with Google, then authenticate with Firebase, and save user to Firestore.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  // 1. Prompt Google Sign-In
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const googleResponse = await GoogleSignin.signIn();

  if (googleResponse.type !== 'success') {
    throw new Error('Google Sign-In was cancelled');
  }

  const { idToken } = googleResponse.data;

  if (!idToken) {
    throw new Error('No ID token received from Google Sign-In');
  }

  // 2. Create Firebase credential
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // 3. Sign in to Firebase
  const userCredential = await auth().signInWithCredential(googleCredential);
  const { user } = userCredential;

  // 4. Save user profile to Firestore (upsert)
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('users').doc(user.uid).set(userProfile, { merge: true });

  return userProfile;
}

/**
 * Sign out from both Google and Firebase.
 */
export async function signOut(): Promise<void> {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {
    // Google sign-out may fail if not signed in, ignore
  }
  await auth().signOut();
}

/**
 * Get current Firebase user (if any).
 */
export function getCurrentUser() {
  return auth().currentUser;
}

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
}

/**
 * Sign up with email and password.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<UserProfile> {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  const { user } = userCredential;

  // Update display name
  await user.updateProfile({ displayName });

  // Save profile to Firestore
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('users').doc(user.uid).set(userProfile, { merge: true });

  return userProfile;
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserProfile> {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  const { user } = userCredential;

  // Fetch or create profile in Firestore
  const doc = await firestore().collection('users').doc(user.uid).get();

  if (doc.exists()) {
    return doc.data() as UserProfile;
  }

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

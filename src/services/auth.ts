import auth from '@react-native-firebase/auth';

export const firebaseAuth = auth();

export async function signUp(email: string, password: string) {
  return firebaseAuth.createUserWithEmailAndPassword(email, password);
}

export async function signIn(email: string, password: string) {
  return firebaseAuth.signInWithEmailAndPassword(email, password);
}

export async function signOut() {
  return firebaseAuth.signOut();
}

export async function resetPassword(email: string) {
  return firebaseAuth.sendPasswordResetEmail(email);
}

export function getCurrentUser() {
  return firebaseAuth.currentUser;
}

import auth from '@react-native-firebase/auth';

export const firebaseAuth = auth();

export async function signUp(email: string, password: string) {
  const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
  await result.user.sendEmailVerification();
  return result;
}

export async function sendVerificationEmail() {
  const user = firebaseAuth.currentUser;
  if (user) await user.sendEmailVerification();
}

export async function reloadCurrentUser() {
  await firebaseAuth.currentUser?.reload();
  return firebaseAuth.currentUser;
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

import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

export const firebaseAuth = auth();

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!response.data?.idToken) throw new Error('Google girişinden idToken alınamadı.');
  // @react-native-google-signin/google-signin'in signIn() yanıtı accessToken
  // içermiyor — ayrıca getTokens() ile alınması gerekiyor. accessToken
  // verilmezse native Firebase Auth SDK'sı boş string'i reddedip
  // "[auth/unknown] accessToken cannot be empty" hatası fırlatıyor.
  const { accessToken } = await GoogleSignin.getTokens();
  const credential = auth.GoogleAuthProvider.credential(response.data.idToken, accessToken);
  return firebaseAuth.signInWithCredential(credential);
}

export async function signInWithApple() {
  // Apple, kimlik jetonunun tekrar oynatma (replay) saldırılarına karşı
  // Firebase tarafından doğrulanabilmesi için ham + SHA256'lanmış bir nonce
  // çifti istiyor: hash'lenmiş olanı Apple'a gönderiyoruz, ham olanı
  // Firebase credential'ına veriyoruz.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashedNonce,
  });
  if (!appleCredential.identityToken) throw new Error('Apple girişinden identityToken alınamadı.');

  const credential = auth.AppleAuthProvider.credential(appleCredential.identityToken, rawNonce);
  return firebaseAuth.signInWithCredential(credential);
}

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

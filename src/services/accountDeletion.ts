/**
 * accountDeletion.ts — Hesap ve tüm kullanıcı verisini kalıcı olarak siler
 * (Apple Guideline 5.1.1(v): hesap oluşturmayı destekleyen uygulamalar
 * uygulama içinden hesap silme sunmak zorunda)
 *
 * Sıra önemli: önce Firestore verisi silinir (auth hâlâ geçerliyken —
 * güvenlik kuralları request.auth.uid gerektiriyor), sonra yerel SQLite,
 * en son da Firebase Auth kullanıcısı silinir.
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { firebaseAuth } from '@services/auth';
import { stopRealtimeSync } from '@services/realtime';
import { db as localDb } from '@db/index';
import {
  vehicles, trips, fuelEntries, expenses, incomeEntries,
} from '@db/schema';

const COLLECTIONS = ['vehicles', 'trips', 'fuel_entries', 'expenses', 'income_entries'];

async function deleteAllFirestoreData(uid: string): Promise<void> {
  const db = firestore();
  for (const name of COLLECTIONS) {
    const snap = await db.collection('users').doc(uid).collection(name).get();
    if (snap.empty) continue;
    const batch = db.batch();
    snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
}

async function deleteAllLocalData(): Promise<void> {
  await localDb.delete(incomeEntries);
  await localDb.delete(expenses);
  await localDb.delete(fuelEntries);
  await localDb.delete(trips);
  await localDb.delete(vehicles);
}

export async function deleteAccount(password: string): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.email) {
    throw new Error('Kullanıcı oturumu bulunamadı');
  }

  // Firebase, hesap silme gibi hassas işlemler için yakın zamanda giriş
  // yapılmış olmasını şart koşuyor — şifreyi tekrar isteyip yeniden
  // kimlik doğrulaması yapıyoruz (bu aynı zamanda kazara silmeye karşı
  // bir onay adımı görevi görüyor).
  const credential = auth.EmailAuthProvider.credential(user.email, password);
  await user.reauthenticateWithCredential(credential);

  stopRealtimeSync();
  await deleteAllFirestoreData(user.uid);
  await deleteAllLocalData();
  await user.delete();
}

/**
 * firestore.ts — Firestore CRUD & sync servisi
 *
 * Yapı:
 *   users/{uid}/vehicles/{id}
 *   users/{uid}/trips/{id}
 *   users/{uid}/fuel_entries/{id}
 *   users/{uid}/expenses/{id}
 *   users/{uid}/income_entries/{id}
 */

import firestore from '@react-native-firebase/firestore';
import { getCurrentUser } from '@services/auth';

const db = firestore();

function userCol(collection: string) {
  const uid = getCurrentUser()?.uid;
  if (!uid) throw new Error('Kullanıcı girişi yapılmamış');
  return db.collection('users').doc(uid).collection(collection);
}

// ── Generic CRUD ─────────────────────────────────────────────────────────────

export async function fsUpsert(collection: string, id: number, data: object) {
  await userCol(collection).doc(String(id)).set(
    { ...data, _syncedAt: firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function fsDelete(collection: string, id: number) {
  await userCol(collection).doc(String(id)).delete();
}

export async function fsPullAll(collection: string): Promise<any[]> {
  const snap = await userCol(collection).get();
  return snap.docs.map((d) => ({ ...d.data(), id: parseInt(d.id, 10) }));
}

// ── İlk yükleme: lokal → Firestore (batch) ──────────────────────────────────

export async function pushLocalToFirestore(
  collection: string,
  rows: object[],
): Promise<void> {
  const col = userCol(collection);
  const batch = db.batch();
  for (const row of rows) {
    const r = row as any;
    if (!r.id) continue;
    batch.set(
      col.doc(String(r.id)),
      { ...r, _syncedAt: firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
  await batch.commit();
}

// ── Gerçek zamanlı dinleyici ─────────────────────────────────────────────────

export function listenCollection(
  collection: string,
  onUpdate: (rows: any[]) => void,
) {
  return userCol(collection).onSnapshot((snap) => {
    const rows = snap.docs.map((d) => ({ ...d.data(), id: parseInt(d.id, 10) }));
    onUpdate(rows);
  });
}

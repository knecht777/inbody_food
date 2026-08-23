import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { BodyMeasurement } from "@/types/BodyMeasurement";

function bodyMeasurementsRef(uid: string) {
  return collection(db, "users", uid, "bodyMeasurements");
}

export async function addBodyMeasurement(
  uid: string,
  data: Omit<BodyMeasurement, "id" | "userId" | "createdAt">,
): Promise<void> {
  const ref = doc(bodyMeasurementsRef(uid));
  const measurement: BodyMeasurement = {
    ...data,
    id: ref.id,
    userId: uid,
    createdAt: new Date().toISOString(),
  };
  // Firestore rejects `undefined` field values; optional fields left blank
  // in the form (skeletalMuscleMassKg, bodyFatPercent, ...) arrive as undefined.
  const sanitized = Object.fromEntries(
    Object.entries(measurement).filter(([, value]) => value !== undefined),
  ) as BodyMeasurement;
  await setDoc(ref, sanitized);
}

export async function listBodyMeasurements(
  uid: string,
  count = 20,
): Promise<BodyMeasurement[]> {
  const q = query(bodyMeasurementsRef(uid), orderBy("measuredAt", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as BodyMeasurement);
}

export async function getLatestBodyMeasurement(uid: string): Promise<BodyMeasurement | null> {
  const [latest] = await listBodyMeasurements(uid, 1);
  return latest ?? null;
}

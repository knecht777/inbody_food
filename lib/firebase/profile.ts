import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Profile } from "@/types/User";

export async function getProfile(uid: string): Promise<Profile | null> {
  const snapshot = await getDoc(doc(db, "profiles", uid));
  return snapshot.exists() ? (snapshot.data() as Profile) : null;
}

export async function upsertProfile(
  uid: string,
  data: Omit<Profile, "userId" | "updatedAt">,
): Promise<void> {
  const profile: Profile = {
    ...data,
    userId: uid,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "profiles", uid), profile);
}

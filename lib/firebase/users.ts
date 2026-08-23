import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function createUserDocument(uid: string, email: string) {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    createdAt: serverTimestamp(),
  });
}

import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  let adminInitError: string | null = null;
  let authInitError: string | null = null;
  let firestoreInitError: string | null = null;
  let storageInitError: string | null = null;
  let libAdminImportError: string | null = null;

  try {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: key,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });

    try {
      getAuth(app);
    } catch (e) {
      authInitError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
    try {
      getFirestore(app);
    } catch (e) {
      firestoreInitError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
    try {
      getStorage(app);
    } catch (e) {
      storageInitError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  } catch (error) {
    adminInitError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  try {
    await import("@/lib/firebase/admin");
  } catch (error) {
    libAdminImportError =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  return NextResponse.json({
    adminInitError,
    authInitError,
    firestoreInitError,
    storageInitError,
    libAdminImportError,
    hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    hasPrivateKey: !!key,
    privateKeyLength: key?.length ?? 0,
    startsWithQuote: key?.startsWith('"') ?? false,
    endsWithQuote: key?.endsWith('"') ?? false,
    startsWithDashes: key?.trim().replace(/^"/, "").startsWith("-----BEGIN") ?? false,
    hasLiteralBackslashN: key?.includes("\\n") ?? false,
    hasRealNewline: key?.includes("\n") ?? false,
    first20: key?.slice(0, 20) ?? null,
    last20: key?.slice(-20) ?? null,
    hasAiKey: !!process.env.AI_API_KEY,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    hasNotionKey: !!process.env.NOTION_API_KEY,
  });
}

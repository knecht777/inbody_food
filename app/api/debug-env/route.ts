import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  let adminInitError: string | null = null;
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: key,
        }),
      });
    }
  } catch (error) {
    adminInitError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  return NextResponse.json({
    adminInitError,
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

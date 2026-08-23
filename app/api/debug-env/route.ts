import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  let importError: string | null = null;
  let hasAdminAuth = false;

  try {
    const mod = await import("@/lib/firebase/admin");
    hasAdminAuth = !!mod.adminAuth;
  } catch (error) {
    importError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  return NextResponse.json({ importError, hasAdminAuth });
}

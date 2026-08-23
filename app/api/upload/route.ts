import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "유효하지 않은 인증입니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const pathname = formData.get("pathname");

  if (!(file instanceof File) || typeof pathname !== "string") {
    return NextResponse.json({ error: "file, pathname이 필요합니다." }, { status: 400 });
  }
  if (!pathname.startsWith(`users/${uid}/`)) {
    return NextResponse.json({ error: "허용되지 않은 업로드 경로입니다." }, { status: 403 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "파일이 너무 큽니다 (15MB 제한)." }, { status: 400 });
  }

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || "image/jpeg",
  });

  return NextResponse.json({ url: blob.url });
}

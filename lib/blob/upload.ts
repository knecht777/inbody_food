"use client";

import type { User } from "firebase/auth";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

async function uploadPhoto(user: User, pathname: string, file: File): Promise<string> {
  const idToken = await user.getIdToken();
  const resized = await resizeImage(file);

  const formData = new FormData();
  formData.append("file", resized);
  formData.append("pathname", pathname);

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "업로드에 실패했습니다.");
  }

  const { url } = (await response.json()) as { url: string };
  return url;
}

export function uploadMealPhoto(user: User, mealId: string, file: File): Promise<string> {
  return uploadPhoto(user, `users/${user.uid}/meals/${mealId}/original.jpg`, file);
}

export function uploadBodyPhoto(user: User, measurementId: string, file: File): Promise<string> {
  return uploadPhoto(
    user,
    `users/${user.uid}/body-composition/${measurementId}/inbody.jpg`,
    file,
  );
}

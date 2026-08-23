"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/config";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      로그아웃
    </Button>
  );
}

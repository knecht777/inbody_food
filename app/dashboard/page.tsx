"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { LogoutButton } from "@/components/LogoutButton";
import { useAuth } from "@/hooks/useAuth";

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <LogoutButton />
      </div>
      <p className="text-muted-foreground">{user?.email}로 로그인되었습니다.</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

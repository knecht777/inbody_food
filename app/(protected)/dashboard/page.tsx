"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">대시보드</h1>
      <p className="text-muted-foreground">{user?.email}로 로그인되었습니다.</p>
    </div>
  );
}

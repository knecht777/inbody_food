import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNav } from "@/components/AppNav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
        <AppNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}

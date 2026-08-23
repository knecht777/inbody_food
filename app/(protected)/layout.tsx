import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNav } from "@/components/AppNav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <AppNav />
        <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}

import { Salad } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-accent/40 via-background to-background p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-foreground">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Salad className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">인바디 식단</span>
        </div>
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

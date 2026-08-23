"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase/config";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      setError("이메일 전송에 실패했습니다. 이메일 주소를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="비밀번호 재설정">
      {sent ? (
        <p className="text-sm text-muted-foreground">
          비밀번호 재설정 이메일을 보냈습니다. 받은 편지함을 확인해 주세요.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? "전송 중..." : "재설정 이메일 보내기"}
          </Button>
        </form>
      )}
      <div className="mt-4 text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    </AuthShell>
  );
}

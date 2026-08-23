"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/body", label: "인바디" },
  { href: "/goals", label: "목표" },
  { href: "/settings", label: "프로필" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <div className="flex gap-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm text-muted-foreground hover:text-foreground",
              pathname === item.href && "font-semibold text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <LogoutButton />
    </nav>
  );
}

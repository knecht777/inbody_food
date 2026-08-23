"use client";

import { LayoutDashboard, Salad, Scale, Target, FileBarChart, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/meals", label: "식사", icon: Salad },
  { href: "/body", label: "인바디", icon: Scale },
  { href: "/goals", label: "목표", icon: Target },
  { href: "/reports", label: "리포트", icon: FileBarChart },
  { href: "/settings", label: "프로필", icon: UserCircle },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <span className="hidden shrink-0 text-sm font-semibold tracking-tight text-foreground sm:block">
          인바디 식단
        </span>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

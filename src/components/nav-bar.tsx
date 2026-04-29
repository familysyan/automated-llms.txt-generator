"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            profound
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                pathname === "/dashboard"
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}

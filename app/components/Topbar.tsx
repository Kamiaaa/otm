"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";

export default function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden font-semibold text-slate-900">🚗 Car Duty</div>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <Link
          href="/dashboard/change-password"
          className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          Change password
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
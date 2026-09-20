//Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types";
import Image from "next/image";

const EMPLOYEE_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/rides", label: "My Rides" },
  { href: "/dashboard/rides/new", label: "Request a Car" },
];

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/assign", label: "Assign Duty" },
  { href: "/dashboard/rides", label: "All Rides" },
  { href: "/dashboard/cars", label: "Cars" },
  { href: "/dashboard/drivers", label: "Drivers" },
  { href: "/dashboard/pickup-points", label: "Pickup Points" },
  { href: "/dashboard/routes", label: "Routes" },
  { href: "/dashboard/fuel", label: "Fuel" },
  { href: "/dashboard/employees", label: "Employees" },
];

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = role === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen hidden md:block">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">

        <div className="relative h-10 w-32 sm:h-12 sm:w-36 lg:h-14 lg:w-44 mx-auto">
          <Image
            src="/globe.svg"
            alt="Lithium Battery Company Logo"
            fill
            loading="eager"
            className="object-contain"
            priority
          />
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

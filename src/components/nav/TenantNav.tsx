"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BedDouble,
  DollarSign,
  Megaphone,
  MessageSquare,
  Wrench,
  Settings,
  FileText,
  ClipboardList,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { RentaBedLogo } from "@/components/nav/Sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const items: NavItem[] = [
  { href: "/tenant", label: "Home", icon: Home, exact: true },
  { href: "/tenant/status", label: "My Bookings", icon: ClipboardList },
  { href: "/tenant/bed", label: "My Bed", icon: BedDouble },
  { href: "/tenant/rent", label: "Rent & Payments", icon: DollarSign },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/documents", label: "Documents", icon: FileText },
];

const bottomItems: NavItem[] = [
  { href: "/tenant/announcements", label: "Announcements", icon: Megaphone },
  { href: "/tenant/settings", label: "Settings", icon: Settings },
];

export function TenantNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Close menu when route changes
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  React.useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [menuOpen]);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/availability" className="flex items-center gap-2">
            <RentaBedLogo />
            <span className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight text-slate-900">
                renta bed
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Tenant Portal
              </span>
            </span>
          </Link>
        </div>
      </header>

      {/* Slide-out Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />

          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
              <Link
                href="/availability"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <RentaBedLogo />
                <span className="flex flex-col leading-none">
                  <span className="text-lg font-semibold tracking-tight text-slate-900">
                    renta bed
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Tenant Portal
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            active ? "text-indigo-600" : "text-slate-400"
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-slate-100 px-3 py-4">
              <ul className="mb-2 space-y-1">
                {bottomItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            active ? "text-indigo-600" : "text-slate-400"
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-5 w-5 text-slate-400" />
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
}

interface SidebarProps {
  brand: { label: string; href: string; sublabel?: string };
  items: SidebarItem[];
  bottomItems?: SidebarItem[];
  onLogout?: () => void;
}

export function Sidebar({ brand, items, bottomItems, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: SidebarItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <Link href={brand.href} className="flex items-center gap-2.5">
          <RoomLinkLogo />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Room Link
            </span>
            {brand.sublabel && (
              <span className="text-xs font-medium text-slate-400">
                {brand.sublabel}
              </span>
            )}
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-indigo-600" : "text-slate-400")} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-100 px-3 py-4">
        {bottomItems && bottomItems.length > 0 && (
          <ul className="mb-2 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-indigo-600" : "text-slate-400")} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            Log Out
          </button>
        )}
      </div>
    </aside>
  );
}

function RoomLinkLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Two interlocking circles logo */}
      <circle
        cx="12"
        cy="16"
        r="8"
        stroke="#6366F1"
        strokeWidth="2.5"
        fill="none"
      />
      <circle
        cx="20"
        cy="16"
        r="8"
        stroke="#6366F1"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  );
}

export { RoomLinkLogo };

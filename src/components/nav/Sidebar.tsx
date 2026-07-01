"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const isActive = (item: SidebarItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const nav = (
    <SidebarContent
      brand={brand}
      items={items}
      bottomItems={bottomItems}
      onLogout={onLogout}
      isActive={isActive}
    />
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={brand.href} className="flex items-center gap-2">
          <RoomLinkLogo />
          <span className="text-base font-semibold tracking-tight text-slate-900">
            {brand.label}
          </span>
        </Link>
      </header>

      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({
  brand,
  items,
  bottomItems,
  onLogout,
  isActive,
}: SidebarProps & { isActive: (item: SidebarItem) => boolean }) {
  return (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <Link href={brand.href} className="flex items-center gap-2.5">
          <RoomLinkLogo />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              {brand.label}
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
          {items.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(item)} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-100 px-3 py-4">
        {bottomItems && bottomItems.length > 0 && (
          <ul className="mb-2 space-y-1">
            {bottomItems.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(item)} />
              </li>
            ))}
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
    </>
  );
}

function NavLink({ item, active }: { item: SidebarItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon
        className={cn("h-5 w-5", active ? "text-indigo-600" : "text-slate-400")}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
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
      {/* Bed icon logo */}
      {/* Bed frame */}
      <rect x="4" y="18" width="24" height="3" rx="1" stroke="#6366F1" strokeWidth="2" fill="none" />
      {/* Legs */}
      <line x1="6" y1="21" x2="6" y2="26" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="21" x2="26" y2="26" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      {/* Headboard */}
      <path d="M4 18V12C4 10.8954 4.89543 10 6 10H26C27.1046 10 28 10.8954 28 12V18" stroke="#6366F1" strokeWidth="2" fill="none" />
      {/* Pillows */}
      <rect x="7" y="12" width="7" height="5" rx="1.5" fill="#818CF8" stroke="#6366F1" strokeWidth="1" />
      <rect x="18" y="12" width="7" height="5" rx="1.5" fill="#818CF8" stroke="#6366F1" strokeWidth="1" />
    </svg>
  );
}

export { RoomLinkLogo };

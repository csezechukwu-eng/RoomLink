"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, Home, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RentaBedLogo } from "@/components/nav/Sidebar";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { href: "/availability", label: "Find a Bed" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#about", label: "About" },
];

interface PublicNavUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

interface PublicNavProps {
  user?: PublicNavUser | null;
}

export function PublicNav({ user }: PublicNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await signOut();
  };

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const portalHref = user?.role === "landlord" ? "/dashboard" : "/tenant";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              renta bed
            </span>
            <RentaBedLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA / User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              /* Logged in - Show user menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 transition-colors hover:bg-slate-50"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href={portalHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Home className="h-4 w-4" />
                      {user.role === "landlord" ? "Host Dashboard" : "My Portal"}
                    </Link>
                    <Link
                      href={user.role === "landlord" ? "/dashboard/settings" : "/tenant/settings"}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : pathname === "/hosting" ? (
              /* Hosting page - show host login */
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  Host Log In
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Start Hosting
                  </Button>
                </Link>
              </>
            ) : (
              /* Default - show tenant login */
              <>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  Log In
                </Link>
                <Link href="/join">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-slate-100">
              {user ? (
                /* Logged in mobile menu */
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{displayName}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href={portalHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Home className="h-5 w-5" />
                    {user.role === "landlord" ? "Host Dashboard" : "My Portal"}
                  </Link>
                  <Link
                    href={user.role === "landlord" ? "/dashboard/settings" : "/tenant/settings"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Log Out
                  </button>
                </>
              ) : pathname === "/hosting" ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-center text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Host Log In
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Start Hosting
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-center text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Log In
                  </Link>
                  <Link href="/join" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

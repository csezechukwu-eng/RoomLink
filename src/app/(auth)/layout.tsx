import Link from "next/link";
import { RentaBedLogo } from "@/components/nav/Sidebar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <RentaBedLogo />
              <span className="text-lg font-bold text-slate-900">renta bed</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}

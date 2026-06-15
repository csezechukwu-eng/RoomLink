import Link from "next/link";
import Image from "next/image";
import {
  Play,
  BedDouble,
  ClipboardCheck,
  DollarSign,
  MessageSquare,
  CalendarClock,
  Plane,
  Stethoscope,
  GraduationCap,
  Building,
  Home,
  Users,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left: Copy */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Run Your Crash Pad.
              <br />
              <span className="text-slate-900">Not a Spreadsheet.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              The all-in-one platform for crash pads, room rentals, and shared housing.
              Manage beds, tenants, payments, and communication in one powerful dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/availability">
                <Button size="md" className="h-12 px-6 text-base">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="md" className="h-12 px-6 text-base gap-2">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Live Bed Availability
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Online Applications
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Rent & Deposit Tracking
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                House Communication
              </span>
            </div>
          </div>

          {/* Right: Hero Image with Dashboard Preview Overlay */}
          <div className="relative">
            {/* Background Image - Off-centered for aesthetic */}
            <div className="relative h-[420px] lg:h-[480px] overflow-hidden rounded-2xl">
              <Image
                src="/images/hero-crashpad.png"
                alt="Modern crash pad living room"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Subtle gradient overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
            </div>

            {/* Dashboard Preview Card - Overlapping the image */}
            <div className="absolute -bottom-8 -left-4 lg:-left-12 z-10 w-[90%] max-w-md">
              <DashboardPreview />
            </div>
          </div>
        </div>

        {/* Extra spacing to account for overlapping card */}
        <div className="h-16 lg:h-8" />
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything You Need to Manage Your Property
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            From bed tracking to tenant communication, we&apos;ve built the tools that crash pad operators need.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <FeatureCard
            icon={<BedDouble className="h-6 w-6" />}
            title="Live Availability"
            description="Show real-time bed availability and let tenants apply online."
          />
          <FeatureCard
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Applications"
            description="Review and approve applications all in one place."
          />
          <FeatureCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Rent Tracking"
            description="Track rent, deposits, and payments with ease."
          />
          <FeatureCard
            icon={<MessageSquare className="h-6 w-6" />}
            title="Communication"
            description="Send announcements and message tenants instantly."
          />
          <FeatureCard
            icon={<CalendarClock className="h-6 w-6" />}
            title="Move-Outs"
            description="Manage 30-day notices and keep your turnover organized."
          />
        </div>
      </section>

      {/* Built For Section */}
      <section className="rounded-3xl bg-slate-900 px-6 py-16 sm:px-12 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for Crash Pads and Shared Housing
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Whether you house flight crews, travel nurses, or students, RoomLink is designed for your unique needs.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12">
          <AudienceIcon icon={<Plane className="h-8 w-8" />} label="Flight Crews" />
          <AudienceIcon icon={<Stethoscope className="h-8 w-8" />} label="Travel Nurses" />
          <AudienceIcon icon={<GraduationCap className="h-8 w-8" />} label="Students" />
          <AudienceIcon icon={<Building className="h-8 w-8" />} label="Midterm Rentals" />
          <AudienceIcon icon={<Home className="h-8 w-8" />} label="Shared Housing" />
          <AudienceIcon icon={<Users className="h-8 w-8" />} label="And More" />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="about">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Loved by Property Operators
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <TestimonialCard
            quote="Room Link has completely changed how I run my crash pad. No more spreadsheets, no more missed payments, no more chaos."
            author="Marcus D."
            role="Crash Pad Owner"
          />
          <TestimonialCard
            quote="I manage 3 properties with over 40 beds. Before RoomLink, it was a nightmare keeping track of everything. Now it's effortless."
            author="Sarah K."
            role="Property Manager"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Ready to simplify your property management?
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Join hundreds of crash pad operators who&apos;ve made the switch.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/availability">
            <Button size="md" className="h-12 px-8 text-base">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="md" className="h-12 px-8 text-base">
              View Demo Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardPreview() {
  return (
    <Card className="overflow-hidden shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/50 backdrop-blur-sm">
      <div className="bg-white/95 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Charlotte Flight Crew Crash Pad</p>
            <div className="mt-4 flex gap-8">
              <div>
                <p className="text-3xl font-bold text-slate-900">16</p>
                <p className="text-sm text-slate-500">Total Beds</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">12</p>
                <p className="text-sm text-slate-500">Occupied</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">3</p>
                <p className="text-sm text-slate-500">Reserved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">1</p>
                <p className="text-sm text-slate-500">Available</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Monthly Revenue</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">$9,450</span>
            <span className="text-sm text-slate-500">This Month</span>
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Paid $8,150
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Pending $1,300
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Late $650
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 text-center hover:shadow-md transition-shadow">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
    </Card>
  );
}

function AudienceIcon({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-300">{label}</span>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <Card className="p-8">
      <blockquote className="text-lg text-slate-700 leading-relaxed">
        <span className="text-4xl text-slate-300 leading-none">&quot;</span>
        {quote}
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {author.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{author}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </div>
    </Card>
  );
}

import Link from "next/link";
import Image from "next/image";
import {
  BedDouble,
  DollarSign,
  Shield,
  Wifi,
  Zap,
  MapPin,
  Search,
  CheckCircle,
  ArrowRight,
  Plane,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Heart,
  Clock,
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
              Affordable Housing.
              <br />
              <span className="text-indigo-600">One Bed at a Time.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              renta bed connects you with affordable, fully-furnished beds in shared housing.
              Pay less than traditional rent while getting everything you need — utilities, WiFi, and furniture included.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/availability">
                <Button size="md" className="h-12 px-6 text-base bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Search className="h-4 w-4" />
                  Find a Bed
                </Button>
              </Link>
              <Link href="/hosting">
                <Button variant="outline" size="md" className="h-12 px-6 text-base gap-2">
                  Become a Host
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Fully Furnished
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Utilities Included
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                WiFi Included
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Flexible Terms
              </span>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative">
            <div className="relative h-[420px] lg:h-[480px] overflow-hidden rounded-2xl">
              <Image
                src="/images/hero-living-room.png"
                alt="Comfortable shared housing"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />

              {/* Price Badge */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <p className="text-sm text-slate-500">Starting from</p>
                <p className="text-3xl font-bold text-slate-900">$450<span className="text-lg font-normal text-slate-500">/month</span></p>
                <p className="text-sm text-emerald-600 font-medium">All inclusive</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Rent a Bed Section */}
      <section className="scroll-mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Rent a Bed Instead of an Apartment?
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            The traditional rental model doesn&apos;t work for everyone. renta bed offers a smarter, more affordable way to live.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <ComparisonCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Save 40-60% on Housing"
            description="Why pay $1,500+ for an apartment when you can get a fully-furnished bed with all utilities included for a fraction of the cost?"
            highlight="Average savings: $600/month"
          />
          <ComparisonCard
            icon={<Zap className="h-6 w-6" />}
            title="Move In Ready"
            description="No furniture to buy, no utility setup, no WiFi installation. Just bring your bags and start living. Everything is already set up."
            highlight="Move in within 24 hours"
          />
          <ComparisonCard
            icon={<Clock className="h-6 w-6" />}
            title="Flexible Terms"
            description="Month-to-month options available. Perfect for travel professionals, students, or anyone who needs flexibility without long-term leases."
            highlight="No 12-month commitments"
          />
        </div>
      </section>

      {/* What's Included Section */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-16 sm:px-12 sm:py-20 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything Included. One Simple Price.
          </h2>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            No hidden fees, no surprise bills. Your rent covers it all.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <IncludedItem icon={<BedDouble className="h-6 w-6" />} label="Furnished Bed & Room" />
          <IncludedItem icon={<Wifi className="h-6 w-6" />} label="High-Speed WiFi" />
          <IncludedItem icon={<Zap className="h-6 w-6" />} label="All Utilities" />
          <IncludedItem icon={<Shield className="h-6 w-6" />} label="Safe & Secure" />
        </div>
        <div className="mt-12 text-center">
          <Link href="/availability">
            <Button size="md" className="h-12 px-8 text-base bg-white text-indigo-600 hover:bg-indigo-50">
              Browse Available Beds
            </Button>
          </Link>
        </div>
      </section>

      {/* Perfect For Section */}
      <section>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Perfect For
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            renta bed serves professionals and individuals who need affordable, flexible housing.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AudienceCard
            icon={<Plane className="h-8 w-8" />}
            title="Flight Crews"
            description="Crash pads near airports with flexible schedules that match your routes."
          />
          <AudienceCard
            icon={<Stethoscope className="h-8 w-8" />}
            title="Travel Nurses"
            description="Short-term housing near hospitals for your contract assignments."
          />
          <AudienceCard
            icon={<GraduationCap className="h-8 w-8" />}
            title="Students"
            description="Affordable housing near campus without the commitment of a full lease."
          />
          <AudienceCard
            icon={<Briefcase className="h-8 w-8" />}
            title="Remote Workers"
            description="Live anywhere affordably while working from home or exploring new cities."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 rounded-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Finding your next home is simple with renta bed.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <StepCard
            step="1"
            title="Browse Listings"
            description="Search available beds by location, price, and amenities. See real photos and detailed descriptions."
          />
          <StepCard
            step="2"
            title="Apply Online"
            description="Submit your application in minutes. No paperwork, no hassle. Get approved quickly."
          />
          <StepCard
            step="3"
            title="Move In"
            description="Once approved, pay your deposit and move in. Your fully-furnished space is ready and waiting."
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What Our Renters Say
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <TestimonialCard
            quote="As a flight attendant, I needed somewhere affordable near the airport without a long-term commitment. renta bed was perfect. I save over $800 a month compared to renting my own place."
            author="Jessica M."
            role="Flight Attendant, Atlanta"
          />
          <TestimonialCard
            quote="Moving to a new city for my travel nursing contract was stressful. renta bed made it easy — I found a great place in 2 days and moved in the same week."
            author="David R."
            role="Travel Nurse, Houston"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="rounded-3xl bg-slate-900 px-6 py-16 sm:px-12 sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Find Your Next Home?
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Browse hundreds of affordable, fully-furnished beds across the country.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/availability">
              <Button size="md" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700">
                Find a Bed Near You
              </Button>
            </Link>
            <Link href="/hosting">
              <Button variant="outline" size="md" className="h-12 px-8 text-base border-slate-600 text-white hover:bg-slate-800">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ComparisonCard({
  icon,
  title,
  description,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600 leading-relaxed">{description}</p>
      <p className="mt-4 text-sm font-medium text-emerald-600">{highlight}</p>
    </Card>
  );
}

function IncludedItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function AudienceCard({
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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
    </Card>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg">
        {step}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600 leading-relaxed">{description}</p>
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
      <div className="flex gap-1 text-amber-400 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Heart key={star} className="h-5 w-5 fill-current" />
        ))}
      </div>
      <blockquote className="text-lg text-slate-700 leading-relaxed">
        &quot;{quote}&quot;
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
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

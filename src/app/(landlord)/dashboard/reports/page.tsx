"use client";

import { useState } from "react";
import {
  DollarSign,
  CheckCircle,
  Users,
  Bed,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronDown,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Mock data for charts
const REVENUE_DATA = [
  { month: "Jan", expected: 32000, collected: 30500 },
  { month: "Feb", expected: 33000, collected: 31000 },
  { month: "Mar", expected: 34000, collected: 32500 },
  { month: "Apr", expected: 35000, collected: 33000 },
  { month: "May", expected: 38450, collected: 34150 },
  { month: "Jun", expected: 42000, collected: 40000 },
  { month: "Jul", expected: 45000, collected: 43500 },
  { month: "Aug", expected: 44000, collected: 42000 },
  { month: "Sep", expected: 0, collected: 0 },
  { month: "Oct", expected: 0, collected: 0 },
  { month: "Nov", expected: 0, collected: 0 },
  { month: "Dec", expected: 0, collected: 0 },
];

const REVENUE_BY_PROPERTY = [
  { name: "Charlotte Flight Crew Pad", revenue: 18450, color: "bg-indigo-500" },
  { name: "Concord Travel Nurse House", revenue: 12100, color: "bg-indigo-400" },
  { name: "Gastonia Crew Housing", revenue: 7300, color: "bg-indigo-300" },
  { name: "Rock Hill Travel Pad", revenue: 4700, color: "bg-indigo-200" },
];

const MOVE_OUTS = [
  { room: "Room A / Bed 4", tenant: "John Smith", date: "Jul 15, 2024" },
  { room: "Room B / Bed 2", tenant: "Emily Johnson", date: "Jul 18, 2024" },
  { room: "Room C / Bed 1", tenant: "Michael Brown", date: "Jul 22, 2024" },
];

const REPORT_CARDS = [
  { title: "Monthly Trends", description: "See how your properties performed month over month." },
  { title: "Occupancy Report", description: "Detailed occupancy and bed utilization." },
  { title: "Financial Report", description: "Revenue, expenses, profit and loss." },
  { title: "Tenant Report", description: "Tenant demographics and lease insights." },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("May 1 - May 31, 2024");

  // Chart scaling
  const maxRevenue = Math.max(...REVENUE_DATA.map((d) => Math.max(d.expected, d.collected)));
  const maxPropertyRevenue = Math.max(...REVENUE_BY_PROPERTY.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500">Insights and analytics across your properties.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            {dateRange}
            <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
          value="$38,450"
          label="Expected Revenue"
          sublabel="This Month"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          value="$34,150"
          label="Collected Revenue"
          sublabel="88% of expected"
          sublabelColor="text-emerald-600"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          value="91%"
          label="Occupancy Rate"
          trend={{ value: "0%", direction: "neutral" }}
        />
        <StatCard
          icon={<Bed className="h-5 w-5 text-blue-600" />}
          value="6"
          label="Available Beds"
          sublabel="Out of 64"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          value="45 Days"
          label="Avg Stay Length"
          trend={{ value: "5 days", direction: "up" }}
        />
        <StatCard
          icon={<TrendingDown className="h-5 w-5 text-emerald-600" />}
          value="12%"
          label="Turnover Rate"
          trend={{ value: "2%", direction: "down" }}
          trendGood
        />
      </div>

      {/* Revenue Overview & Occupancy */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue Overview Chart */}
        <Card className="col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span className="text-sm text-slate-600">Expected Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">Collected Revenue</span>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400">
              <span>$50K</span>
              <span>$40K</span>
              <span>$30K</span>
              <span>$20K</span>
              <span>$10K</span>
              <span>$0</span>
            </div>

            {/* Chart area */}
            <div className="ml-12 h-full">
              <svg viewBox="0 0 600 200" className="h-full w-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 40}
                    x2="600"
                    y2={i * 40}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                ))}

                {/* Expected Revenue Line */}
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  points={REVENUE_DATA.slice(0, 8)
                    .map((d, i) => `${i * 75 + 37.5},${200 - (d.expected / 50000) * 200}`)
                    .join(" ")}
                />

                {/* Collected Revenue Line */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={REVENUE_DATA.slice(0, 8)
                    .map((d, i) => `${i * 75 + 37.5},${200 - (d.collected / 50000) * 200}`)
                    .join(" ")}
                />

                {/* Data points - Expected */}
                {REVENUE_DATA.slice(0, 8).map((d, i) => (
                  <circle
                    key={`exp-${i}`}
                    cx={i * 75 + 37.5}
                    cy={200 - (d.expected / 50000) * 200}
                    r="4"
                    fill="#6366f1"
                  />
                ))}

                {/* Data points - Collected */}
                {REVENUE_DATA.slice(0, 8).map((d, i) => (
                  <circle
                    key={`col-${i}`}
                    cx={i * 75 + 37.5}
                    cy={200 - (d.collected / 50000) * 200}
                    r="4"
                    fill="#10b981"
                  />
                ))}
              </svg>

              {/* X-axis labels */}
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                {REVENUE_DATA.map((d) => (
                  <span key={d.month}>{d.month}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Occupancy Overview */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Occupancy Overview</h2>

          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative h-40 w-40 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                {/* Occupied (green) - 91% */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="91 100"
                  strokeLinecap="round"
                />
                {/* Reserved (amber) - 5% */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeDasharray="5 100"
                  strokeDashoffset="-91"
                  strokeLinecap="round"
                />
                {/* Vacant (gray) - 4% */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="4"
                  strokeDasharray="4 100"
                  strokeDashoffset="-96"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">64</span>
                <span className="text-xs text-slate-500">Total Beds</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">58</span>
                <span className="text-sm text-slate-500">Occupied (91%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600">3</span>
                <span className="text-sm text-slate-500">Reserved (5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-400" />
                <span className="text-sm text-slate-600">3</span>
                <span className="text-sm text-slate-500">Vacant (5%)</span>
              </div>
            </div>
          </div>

          <button className="mt-6 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Bed Map
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>
      </div>

      {/* Revenue by Property, Collection Rate, Move Outs */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue by Property */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Revenue by Property</h2>

          <div className="space-y-4">
            {REVENUE_BY_PROPERTY.map((property) => (
              <div key={property.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate max-w-[180px]">{property.name}</span>
                  <span className="font-medium text-slate-900">${property.revenue.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${property.color}`}
                    style={{ width: `${(property.revenue / maxPropertyRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="mt-4 flex justify-between text-xs text-slate-400">
            <span>$0</span>
            <span>$5K</span>
            <span>$10K</span>
            <span>$15K</span>
            <span>$20K</span>
          </div>
        </Card>

        {/* Rent Collection Rate */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Rent Collection Rate</h2>

          <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="89 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">89%</span>
                <span className="text-xs text-slate-500">Collection Rate</span>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              6% from last month
            </p>

            <button className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View Details
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>

        {/* Move Outs Next 30 Days */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Move Outs Next 30 Days</h2>

          <div className="space-y-4">
            {MOVE_OUTS.map((moveOut, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                  {moveOut.tenant
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{moveOut.room}</p>
                  <p className="text-sm text-slate-500">{moveOut.tenant}</p>
                </div>
                <span className="text-sm text-slate-500">{moveOut.date}</span>
              </div>
            ))}
          </div>

          <button className="mt-6 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All Move Outs
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-4 gap-4">
        {REPORT_CARDS.map((report) => (
          <Card key={report.title} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{report.title}</h3>
              <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View Full Report
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">{report.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Components

function StatCard({
  icon,
  value,
  label,
  sublabel,
  sublabelColor,
  trend,
  trendGood,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  sublabelColor?: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  trendGood?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && (
        <p className={`text-xs ${sublabelColor || "text-slate-400"}`}>{sublabel}</p>
      )}
      {trend && (
        <p
          className={`flex items-center gap-1 text-xs ${
            trend.direction === "neutral"
              ? "text-slate-500"
              : trend.direction === "up"
              ? trendGood
                ? "text-emerald-600"
                : "text-emerald-600"
              : trendGood
              ? "text-emerald-600"
              : "text-red-600"
          }`}
        >
          {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
          {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
          {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
          {trend.value} from last month
        </p>
      )}
    </Card>
  );
}

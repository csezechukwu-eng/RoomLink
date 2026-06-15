"use client";

import { useTransition } from "react";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  ClipboardList,
  CalendarCheck,
  DollarSign,
  Users,
  Megaphone,
  MessageSquare,
  Wrench,
  BarChart3,
  Settings,
} from "lucide-react";
import { Sidebar, type SidebarItem } from "@/components/nav/Sidebar";
import { signOut } from "@/lib/actions/auth";

const items: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/rooms", label: "Rooms & Beds", icon: BedDouble },
  { href: "/dashboard/applications", label: "Applications", icon: ClipboardList },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/dashboard/rent", label: "Rent & Payments", icon: DollarSign },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const bottomItems: SidebarItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function LandlordNav() {
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <Sidebar
      brand={{ label: "Room Link", href: "/dashboard" }}
      items={items}
      bottomItems={bottomItems}
      onLogout={handleLogout}
    />
  );
}

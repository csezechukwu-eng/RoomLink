"use client";

import { useTransition } from "react";
import {
  LayoutDashboard,
  Building2,
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

// Note: Rooms & Beds are now managed inside each property detail page
// (/dashboard/properties/[propertyId]) rather than as a standalone nav item.
const items: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/applications", label: "Applications", icon: ClipboardList },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/dashboard/rent", label: "Rent & Payments", icon: DollarSign },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

// Announcements kept here (out of the primary operations list) so the main
// sidebar stays focused, while the route remains reachable.
const bottomItems: SidebarItem[] = [
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
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

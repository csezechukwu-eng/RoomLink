"use client";

import { useTransition } from "react";
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
} from "lucide-react";
import { Sidebar, type SidebarItem } from "@/components/nav/Sidebar";
import { signOut } from "@/lib/actions/auth";

const items: SidebarItem[] = [
  { href: "/tenant", label: "Home", icon: Home, exact: true },
  { href: "/tenant/status", label: "My Bookings", icon: ClipboardList },
  { href: "/tenant/bed", label: "My Bed", icon: BedDouble },
  { href: "/tenant/rent", label: "Rent & Payments", icon: DollarSign },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/documents", label: "Documents", icon: FileText },
];

const bottomItems: SidebarItem[] = [
  { href: "/tenant/announcements", label: "Announcements", icon: Megaphone },
  { href: "/tenant/settings", label: "Settings", icon: Settings },
];

export function TenantNav() {
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <Sidebar
      brand={{ label: "renta bed", href: "/tenant", sublabel: "Tenant Portal" }}
      items={items}
      bottomItems={bottomItems}
      onLogout={handleLogout}
    />
  );
}

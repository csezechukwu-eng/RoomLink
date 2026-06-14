"use client";

import {
  Home,
  BedDouble,
  DollarSign,
  Megaphone,
  MessageSquare,
  Wrench,
  User,
  FileText,
} from "lucide-react";
import { Sidebar, type SidebarItem } from "@/components/nav/Sidebar";

const items: SidebarItem[] = [
  { href: "/tenant", label: "Home", icon: Home, exact: true },
  { href: "/tenant/bed", label: "My Bed", icon: BedDouble },
  { href: "/tenant/rent", label: "Rent & Payments", icon: DollarSign },
  { href: "/tenant/announcements", label: "Announcements", icon: Megaphone },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/profile", label: "Profile", icon: User },
  { href: "/tenant/documents", label: "Documents", icon: FileText },
];

export function TenantNav() {
  return (
    <Sidebar
      brand={{ label: "Room Link", href: "/tenant", sublabel: "Tenant Portal" }}
      items={items}
      onLogout={() => {
        // TODO: Implement logout
        window.location.href = "/";
      }}
    />
  );
}

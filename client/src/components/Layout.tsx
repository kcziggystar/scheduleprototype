/**
 * BrightSmiles – Layout Components
 * Design: Warm Professional – navy sidebar, off-white canvas, sky/amber accents
 */

import { Link, useLocation } from "wouter";
import {
  Calendar,
  Users,
  MapPin,
  ClipboardList,
  Home,
  Menu,
  X,
  Stethoscope,
  Plane,
  CalendarOff,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",         label: "Home",        icon: Home },
  { href: "/book",     label: "Book Appointment", icon: Calendar },
  { href: "/admin",    label: "Admin",        icon: ClipboardList },
  { href: "/admin/providers", label: "Providers",   icon: Users },
  { href: "/admin/shifts",    label: "Shift Plans", icon: Calendar },
  { href: "/admin/locations", label: "Locations",   icon: MapPin },
];

const PATIENT_NAV = [
  { href: "/",     label: "Home",             icon: Home },
  { href: "/book", label: "Book Appointment", icon: Calendar },
];

const ADMIN_NAV = [
  { href: "/admin",              label: "Dashboard",    icon: ClipboardList },
  { href: "/admin/providers",    label: "Providers",    icon: Users },
  { href: "/admin/shifts",       label: "Shift Plans",  icon: Calendar },
  { href: "/admin/locations",    label: "Locations",    icon: MapPin },
  { href: "/admin/appointments", label: "Appointments", icon: Stethoscope },
  { href: "/admin/pto",          label: "PTO Editor",   icon: Plane },
  { href: "/admin/holidays",     label: "Holidays",     icon: CalendarOff },
];

export function TopNav() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-lg text-foreground">
            BrightSmiles
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {PATIENT_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors no-underline",
                location === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="w-px h-5 bg-border mx-2" />
          <Link
            href="/admin"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors no-underline",
              location.startsWith("/admin")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Admin
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          {[...PATIENT_NAV, { href: "/admin", label: "Admin", icon: ClipboardList }].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium no-underline",
                location === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <div className="px-4 py-5 border-b border-sidebar-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/50">
            Admin Panel
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium no-underline transition-colors",
                location === href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}

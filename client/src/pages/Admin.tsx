/**
 * BrightSmiles – Admin Dashboard
 * Design: Warm Professional – data-dense but warm
 */

import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PROVIDERS,
  LOCATIONS,
  SHIFT_PLANS,
  SHIFTS,
  SHIFT_SEGMENTS,
  HOLIDAY_DATES,
  PTO_ENTRIES,
  APPOINTMENTS,
  getLocation,
} from "@/lib/data";
import { Users, MapPin, Calendar, ClipboardList, CalendarOff, Plane } from "lucide-react";

const STAT_CARDS = [
  { label: "Providers",     value: PROVIDERS.length,      icon: Users,          color: "text-blue-600",  bg: "bg-blue-50" },
  { label: "Locations",     value: LOCATIONS.length,      icon: MapPin,         color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Shift Plans",   value: SHIFT_PLANS.length,    icon: Calendar,       color: "text-amber-600",  bg: "bg-amber-50" },
  { label: "Appointments",  value: APPOINTMENTS.length,   icon: ClipboardList,  color: "text-violet-600", bg: "bg-violet-50" },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of BrightSmiles scheduling data</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Providers */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Providers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROVIDERS.map((p) => {
                const loc = getLocation(p.primaryLocationId);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover object-top shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{loc?.name}</p>
                    </div>
                    <Badge variant={p.role === "Dentist" ? "default" : "secondary"} className="text-xs shrink-0">
                      {p.role}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Shift Plans */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Shift Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SHIFT_PLANS.map((sp) => {
                const shifts = SHIFTS.filter((s) => s.shiftPlanId === sp.id);
                const segCount = SHIFT_SEGMENTS.filter((seg) =>
                  shifts.some((s) => s.id === seg.shiftId)
                ).length;
                return (
                  <div key={sp.id} className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-foreground">{sp.name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {sp.shiftCycle} {sp.shiftCycleUnit}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {shifts.length} shift{shifts.length !== 1 ? "s" : ""} · {segCount} segment{segCount !== 1 ? "s" : ""} · Effective {sp.effectiveDate.split("T")[0]}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Holidays */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-destructive" /> Holiday Calendar 2026
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {HOLIDAY_DATES.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{h.name}</span>
                    <span className="text-muted-foreground tabular-nums">{h.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PTO */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Plane className="w-4 h-4 text-amber-500" /> PTO Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PTO_ENTRIES.map((pto) => {
                  const provider = PROVIDERS.find((p) => {
                    const ptoCal = p.ptoCalendarId;
                    return ptoCal === pto.calendarId;
                  });
                  return (
                    <div key={pto.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-foreground">{provider?.name ?? "Unknown"}</p>
                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                          {pto.notes}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pto.start.replace("T", " ")} → {pto.end.replace("T", " ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shift Segments table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Shift Segments</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["ID","Name","Shift","Days","Start","Duration","Location"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHIFT_SEGMENTS.map((seg, i) => {
                  const shift = SHIFTS.find((s) => s.id === seg.shiftId);
                  const loc = seg.locationId ? getLocation(seg.locationId) : null;
                  return (
                    <tr key={seg.id} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{seg.id}</td>
                      <td className="py-2 px-3 font-medium">{seg.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{shift?.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{seg.weekDays.join(", ")}</td>
                      <td className="py-2 px-3 tabular-nums">{seg.startTime}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{seg.duration}</Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{loc?.name ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

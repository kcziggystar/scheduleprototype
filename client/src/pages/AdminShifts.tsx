/**
 * BrightSmiles – Admin Shift Plans Page
 */

import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SHIFT_PLANS, SHIFTS, SHIFT_SEGMENTS, getLocation } from "@/lib/data";
import { Clock, MapPin } from "lucide-react";

const DAY_COLORS: Record<string, string> = {
  Mon: "bg-blue-100 text-blue-700",
  Tue: "bg-violet-100 text-violet-700",
  Wed: "bg-emerald-100 text-emerald-700",
  Thu: "bg-amber-100 text-amber-700",
  Fri: "bg-rose-100 text-rose-700",
  Sat: "bg-orange-100 text-orange-700",
  Sun: "bg-slate-100 text-slate-700",
};

export default function AdminShifts() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Shift Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Shift plans, shifts, and their segment definitions
          </p>
        </div>

        {SHIFT_PLANS.map((plan) => {
          const shifts = SHIFTS.filter((s) => s.shiftPlanId === plan.id);
          return (
            <div key={plan.id} className="space-y-4">
              {/* Plan header */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-lg font-semibold">{plan.name}</h2>
                <Badge variant="outline">
                  Cycle: {plan.shiftCycle} {plan.shiftCycleUnit}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Effective {plan.effectiveDate.split("T")[0]}
                </span>
                <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {plan.id}
                </span>
              </div>

              {/* Shifts */}
              <div className="grid md:grid-cols-2 gap-4">
                {shifts.map((shift) => {
                  const segments = SHIFT_SEGMENTS.filter((seg) => seg.shiftId === shift.id);
                  return (
                    <Card key={shift.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-display text-sm flex items-center justify-between">
                          <span>{shift.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Cycle {shift.cycleIndex}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">{shift.id}</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {segments.map((seg) => {
                          const loc = seg.locationId ? getLocation(seg.locationId) : null;
                          return (
                            <div
                              key={seg.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 text-sm"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{seg.name}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {seg.weekDays.map((d) => (
                                    <span
                                      key={d}
                                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${DAY_COLORS[d] ?? "bg-gray-100 text-gray-700"}`}
                                    >
                                      {d}
                                    </span>
                                  ))}
                                  {seg.daysOfMonth && (
                                    <span className="text-xs text-muted-foreground">
                                      Day {seg.daysOfMonth.join(", ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0 space-y-1">
                                <div className="flex items-center gap-1 justify-end text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs tabular-nums">{seg.startTime}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">{seg.duration}</Badge>
                                {loc && (
                                  <div className="flex items-center gap-1 justify-end text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-xs">{loc.name.replace(" Clinic", "")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {segments.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No segments defined</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

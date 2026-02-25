/**
 * BrightSmiles – Admin Providers Page
 */

import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PROVIDERS,
  SHIFT_PLANS,
  SHIFTS,
  HOLIDAY_CALENDARS,
  PTO_CALENDARS,
  getLocation,
} from "@/lib/data";
import { MapPin, Calendar, CalendarOff, Plane } from "lucide-react";

export default function AdminProviders() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Providers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dentists and hygienists with their scheduling configuration
          </p>
        </div>

        <div className="grid gap-6">
          {PROVIDERS.map((provider) => {
            const primaryLoc = getLocation(provider.primaryLocationId);
            const holCal = HOLIDAY_CALENDARS.find((h) => h.id === provider.holidayCalendarId);
            const ptoCal = PTO_CALENDARS.find((p) => p.id === provider.ptoCalendarId);
            const plans = SHIFT_PLANS.filter((sp) => provider.shiftPlanIds.includes(sp.id));
            const currentShift = SHIFTS.find((s) => s.id === provider.currentShiftId);

            return (
              <Card key={provider.id} className="shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Photo */}
                  <div className="md:w-48 shrink-0">
                    <img
                      src={provider.photoUrl}
                      alt={provider.name}
                      className="w-full h-48 md:h-full object-cover object-top"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-xl font-semibold">{provider.name}</h2>
                          <Badge variant={provider.role === "Dentist" ? "default" : "secondary"}>
                            {provider.role}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{provider.bio}</p>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {provider.id}
                      </span>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <InfoRow icon={<MapPin className="w-4 h-4 text-primary" />} label="Primary Location" value={primaryLoc?.name ?? "—"} />
                      <InfoRow icon={<Calendar className="w-4 h-4 text-primary" />} label="Current Shift" value={currentShift?.name ?? "—"} />
                      <InfoRow icon={<CalendarOff className="w-4 h-4 text-destructive" />} label="Holiday Calendar" value={holCal?.name ?? "—"} />
                      <InfoRow icon={<Plane className="w-4 h-4 text-amber-500" />} label="PTO Calendar" value={ptoCal?.name ?? "—"} />
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Shift Plans</p>
                      <div className="flex flex-wrap gap-2">
                        {plans.map((sp) => (
                          <Badge key={sp.id} variant="outline" className="text-xs">
                            {sp.name} ({sp.shiftCycle} {sp.shiftCycleUnit})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/**
 * BrightSmiles – Admin Appointments Page
 */

import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENTS, getProvider, getLocation, APPOINTMENT_TYPES } from "@/lib/data";
import { CalendarCheck, Clock, MapPin, User } from "lucide-react";

export default function AdminAppointments() {
  const sorted = [...APPOINTMENTS].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All booked appointments ({sorted.length} total)
          </p>
        </div>

        {sorted.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center">
              <CalendarCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-display text-lg text-muted-foreground">No appointments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Appointments booked through the patient portal will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map((appt) => {
              const provider = getProvider(appt.providerId);
              const location = getLocation(appt.locationId);
              const apptType = APPOINTMENT_TYPES.find((t) => t.value === appt.appointmentType);
              return (
                <Card key={appt.id} className="shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      {provider && (
                        <img
                          src={provider.photoUrl}
                          alt={provider.name}
                          className="w-10 h-10 rounded-full object-cover object-top shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{appt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{appt.patientEmail}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        {appt.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {appt.startTime} ({appt.durationMinutes} min)
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {provider?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {location?.name}
                      </span>
                    </div>

                    <Badge variant="secondary" className="text-xs shrink-0">
                      {apptType?.label ?? appt.appointmentType}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

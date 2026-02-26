import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, CalendarCheck } from "lucide-react";

export default function Admin() {
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const { data: plans = [] } = trpc.shiftPlans.list.useQuery();
  const { data: appointments = [] } = trpc.appointments.list.useQuery({});

  const stats = [
    { label: "Providers", value: providers.length, icon: Users, color: "text-sky-600" },
    { label: "Locations", value: locations.length, icon: MapPin, color: "text-teal-600" },
    { label: "Shift Plans", value: plans.length, icon: Calendar, color: "text-violet-600" },
    { label: "Appointments", value: appointments.length, icon: CalendarCheck, color: "text-amber-600" },
  ];

  const recent = appointments.slice(-5).reverse();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">BrightSmiles admin overview</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="font-display text-base">Recent Appointments</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">{["Patient","Type","Date","Status"].map(h => <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {recent.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                    <td className="py-3 px-4 font-medium">{a.patientName}</td>
                    <td className="py-3 px-4">{a.appointmentType}</td>
                    <td className="py-3 px-4 tabular-nums">{a.date}</td>
                    <td className="py-3 px-4"><Badge variant={a.status === "confirmed" ? "default" : "secondary"} className="text-xs">{a.status}</Badge></td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No appointments yet.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

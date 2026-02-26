import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function AdminShifts() {
  const { data: plans = [], isLoading } = trpc.shiftPlans.list.useQuery();
  const { data: slots = [] } = trpc.shiftPlanSlots.list.useQuery({});
  const { data: templates = [] } = trpc.shiftTemplates.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Shift Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">View rotation cycles and their template slots</p>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="space-y-4">
            {plans.map(plan => {
              const planSlots = slots.filter(s => s.shiftPlanId === plan.id);
              const weekA = planSlots.filter(s => s.cycleIndex === 1);
              const weekB = planSlots.filter(s => s.cycleIndex === 2);
              return (
                <Card key={plan.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> {plan.name}
                      </CardTitle>
                      <Badge variant="outline">{plan.shiftCycle} {plan.shiftCycleUnit} cycle</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Effective {plan.effectiveDate}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[{ label: "Week A", items: weekA }, { label: "Week B", items: weekB }].map(({ label, items }) => (
                        <div key={label}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{label}</p>
                          {items.length === 0 ? <p className="text-xs text-muted-foreground">No slots</p> : (
                            <div className="space-y-1">
                              {items.map(slot => {
                                const tmpl = templates.find(t => t.id === slot.templateId);
                                const loc = locations.find(l => l.id === tmpl?.locationId);
                                return (
                                  <div key={slot.id} className="flex items-center gap-2 p-2 rounded bg-secondary/50 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${tmpl?.color ?? "bg-sky-500"}`} />
                                    <span className="font-medium">{tmpl?.name ?? slot.templateId}</span>
                                    <span className="text-muted-foreground">{loc?.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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

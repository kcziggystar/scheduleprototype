/**
 * BrightSmiles – Admin Locations Page
 */

import { AdminLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { LOCATIONS, PROVIDERS, getLocation } from "@/lib/data";
import { MapPin, Phone, Users } from "lucide-react";

export default function AdminLocations() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Locations</h1>
          <p className="text-muted-foreground text-sm mt-1">Clinic locations and their assigned providers</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {LOCATIONS.map((loc) => {
            const providers = PROVIDERS.filter((p) => p.primaryLocationId === loc.id);
            return (
              <Card key={loc.id} className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-lg font-semibold">{loc.name}</h2>
                      <span className="font-mono text-xs text-muted-foreground">{loc.id}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{loc.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{loc.phone}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Primary Providers
                      </p>
                    </div>
                    {providers.length > 0 ? (
                      <div className="space-y-2">
                        {providers.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover object-top"
                            />
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No primary providers</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

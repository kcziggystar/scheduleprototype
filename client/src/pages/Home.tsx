import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { TopNav } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, ArrowRight, Star, Shield, Clock } from "lucide-react";

const HERO_URL = "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920&q=80&auto=format&fit=crop";

const FEATURES = [
  { icon: Star,   title: "Expert Care",         desc: "Board-certified dentists and hygienists with 10+ years of experience." },
  { icon: Shield, title: "Safe & Comfortable",  desc: "Modern sterilisation protocols and a relaxing, anxiety-free environment." },
  { icon: Clock,  title: "Flexible Scheduling", desc: "Morning, afternoon, and occasional Saturday slots across two locations." },
];

export default function Home() {
  const { data: providers = [] } = trpc.providers.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_URL})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E2D4E]/80 via-[#1E2D4E]/50 to-transparent" />
        <div className="relative container py-24 md:py-36">
          <div className="max-w-xl">
            <Badge className="mb-4 bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/20">Now accepting new patients</Badge>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-white leading-tight">Your smile,<br /><span className="italic text-amber-300">beautifully</span> cared for.</h1>
            <p className="mt-4 text-white/80 text-lg leading-relaxed">BrightSmiles Dental Group offers comprehensive dental care across two convenient Boston-area locations. Book your appointment online in minutes.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book"><Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-white font-semibold shadow-lg">Book an Appointment<ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
              <Link href="/admin"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">Admin Portal</Button></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-5 h-5 text-primary" /></div>
                <div><h3 className="font-display font-semibold text-foreground">{title}</h3><p className="text-muted-foreground text-sm mt-1">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="container">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8">Meet Our Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(p => {
              const loc = locations.find(l => l.id === p.primaryLocationId);
              return (
                <Card key={p.id} className="shadow-sm overflow-hidden">
                  {p.photoUrl && <div className="h-56 overflow-hidden"><img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover object-top" /></div>}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div><h3 className="font-display font-semibold text-foreground">{p.name}</h3><p className="text-xs text-muted-foreground mt-0.5">{loc?.name}</p></div>
                      <Badge variant={p.role === "Dentist" ? "default" : "secondary"} className="text-xs shrink-0">{p.role}</Badge>
                    </div>
                    {p.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>}
                    <Link href="/book"><Button variant="outline" size="sm" className="mt-4 w-full">Book with {p.name.split(" ").slice(0,2).join(" ")}</Button></Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="container">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8">Our Locations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {locations.map(loc => (
              <Card key={loc.id} className="shadow-sm">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{loc.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{loc.address}</p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground"><Phone className="w-3.5 h-3.5" />{loc.phone}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <footer className="bg-[#1E2D4E] text-white/60 py-8 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="font-display font-semibold text-white">BrightSmiles Dental Group</p>
          <p>© 2026 BrightSmiles Dental Group. Prototype – not for clinical use.</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * BrightSmiles Dental – App Router
 * Design: Warm Professional (Fraunces + DM Sans, off-white canvas, navy/sky/amber)
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import AdminDashboard from "./pages/Admin";
import AdminProviders from "./pages/AdminProviders";
import AdminShifts from "./pages/AdminShifts";
import AdminLocations from "./pages/AdminLocations";
import AdminAppointments from "./pages/AdminAppointments";

function Router() {
  return (
    <Switch>
      <Route path="/"                      component={Home} />
      <Route path="/book"                  component={Book} />
      <Route path="/admin"                 component={AdminDashboard} />
      <Route path="/admin/providers"       component={AdminProviders} />
      <Route path="/admin/shifts"          component={AdminShifts} />
      <Route path="/admin/locations"       component={AdminLocations} />
      <Route path="/admin/appointments"    component={AdminAppointments} />
      <Route path="/404"                   component={NotFound} />
      <Route                               component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

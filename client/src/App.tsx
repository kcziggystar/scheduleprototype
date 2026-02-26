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
import AdminPto from "./pages/AdminPto";
import AdminHolidays from "./pages/AdminHolidays";
import AdminTemplates from "./pages/AdminTemplates";
import AdminPlanBuilder from "./pages/AdminPlanBuilder";
import AdminAssignments from "./pages/AdminAssignments";
import AdminScheduleGrid from "./pages/AdminScheduleGrid";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/"                      component={Home} />
      <Route path="/book"                  component={Book} />
      <Route path="/admin"                 component={AdminDashboard} />
      <Route path="/admin/providers"       component={AdminProviders} />
      <Route path="/admin/shifts"          component={AdminShifts} />
      <Route path="/admin/locations"       component={AdminLocations} />
      <Route path="/admin/appointments"    component={AdminAppointments} />
      <Route path="/admin/pto"              component={AdminPto} />
      <Route path="/admin/holidays"         component={AdminHolidays} />
      <Route path="/admin/templates"        component={AdminTemplates} />
      <Route path="/admin/plan-builder"     component={AdminPlanBuilder} />
      <Route path="/admin/assignments"      component={AdminAssignments} />
      <Route path="/admin/schedule-grid"    component={AdminScheduleGrid} />
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

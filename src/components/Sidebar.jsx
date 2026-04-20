import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, CalendarDays, FileText, X, Star, Target, BarChart2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Employees", path: "/employees", icon: Users },
  { label: "Payroll", path: "/payroll", icon: Wallet },
  { label: "Leave Management", path: "/leaves", icon: CalendarDays },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "KPIs", path: "/kpis", icon: Target },
  { label: "Annual Bonus", path: "/bonus", icon: Star },
  { label: "Reports", path: "/reports", icon: BarChart2 },
  { label: "Access Control", path: "/access", icon: ShieldCheck },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center">
            <img
              src="https://media.base44.com/images/public/69dbc5fb705ddc077645cc37/ebd80a0b2_logo_1_transparent.png"
              alt="AMS Analytix"
              className="h-10 w-auto"
            />
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mx-3 mb-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <p className="text-sidebar-foreground/60 text-[10px] uppercase tracking-wider font-semibold mb-2">Companies</p>
          <div className="space-y-1.5">
            <p className="text-sidebar-foreground text-xs font-medium">Al Mithalia for Advanced Market Studies</p>
            <p className="text-sidebar-foreground text-xs font-medium">Advanced Marketing Statistics</p>
          </div>
        </div>
      </aside>
    </>
  );
}
import { CalendarDays, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function RecentActivity({ leaves, payroll }) {
  const items = [
    ...leaves.slice(0, 5).map(l => ({
      type: "leave",
      title: `${l.employee_name} - ${l.leave_type} Leave`,
      subtitle: `${l.days_count} days • ${l.status}`,
      date: l.created_date,
      status: l.status,
    })),
    ...payroll.slice(0, 5).map(p => ({
      type: "payroll",
      title: `${p.employee_name} - Payroll ${p.month}`,
      subtitle: `JOD ${(p.net_salary || 0).toLocaleString()} • ${p.status}`,
      date: p.created_date,
      status: p.status,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Recent Activity</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center",
                item.type === "leave" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {item.type === "leave" ? <CalendarDays className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {moment(item.date).fromNow()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
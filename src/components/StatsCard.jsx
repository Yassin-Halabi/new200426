import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <div className={cn("bg-card rounded-xl border p-5 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
      {trend && (
        <p className={cn("text-xs mt-3 font-medium", trend > 0 ? "text-green-600" : "text-red-500")}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last month
        </p>
      )}
    </div>
  );
}
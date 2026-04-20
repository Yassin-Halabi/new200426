import { Building2 } from "lucide-react";

const companies = [
  { name: "Al Mithalia for Advanced Market Studies", short: "Al Mithalia" },
  { name: "Advanced Marketing Statistics", short: "AMS" },
];

export default function CompanyBreakdown({ employees }) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Company Breakdown</h3>
      <div className="space-y-4">
        {companies.map((company) => {
          const count = employees.filter(e => e.company === company.name).length;
          const active = employees.filter(e => e.company === company.name && e.status === "Active").length;
          const pct = employees.length ? Math.round((count / employees.length) * 100) : 0;
          return (
            <div key={company.name} className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{company.short}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{company.name}</p>
                </div>
                <span className="text-lg font-bold text-card-foreground">{count}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{active} active</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
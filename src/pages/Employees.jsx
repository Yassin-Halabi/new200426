import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EmployeeFormDialog from "../components/EmployeeFormDialog";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-200",
  Terminated: "bg-red-50 text-red-700 border-red-200",
  Probation: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const data = await base44.entities.Employee.list("-created_date");
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(e => {
    const matchSearch = e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.position?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === "all" || e.company === companyFilter;
    return matchSearch && matchCompany;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">{employees.length} team members</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            <SelectItem value="Al Mithalia for Advanced Market Studies">Al Mithalia</SelectItem>
            <SelectItem value="Advanced Marketing Statistics">AMS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => (
          <Link
            key={emp.id}
            to={`/employees/${emp.id}`}
            className="bg-card rounded-xl border p-5 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold text-sm">
                  {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
                  {emp.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate max-w-[140px]">
                  {emp.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS"}
                </span>
              </div>
              <Badge variant="outline" className={statusColors[emp.status] || ""}>
                {emp.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No employees found</p>
        </div>
      )}

      <EmployeeFormDialog open={showForm} onClose={() => setShowForm(false)} onSaved={load} />
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Target, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import StatsCard from "../components/StatsCard";
import KPIEvaluationPanel from "../components/KPIEvaluationPanel";

export default function KPIs() {
  const [kpis, setKpis] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [showForm, setShowForm] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [form, setForm] = useState({ employee_id: "", title: "", description: "", weight: "", target: "", year: new Date().getFullYear().toString() });

  const load = async () => {
    const [k, emps, evals] = await Promise.all([
      base44.entities.KPI.list("-created_date"),
      base44.entities.Employee.list(),
      base44.entities.KPIEvaluation.list("-created_date"),
    ]);
    setKpis(k);
    setEmployees(emps);
    setEvaluations(evals);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = [...new Set([...kpis.map(k => k.year), new Date().getFullYear().toString()])];

  const filteredKpis = kpis.filter(k => {
    const emp = employees.find(e => e.id === k.employee_id);
    const matchSearch = emp?.full_name?.toLowerCase().includes(search.toLowerCase()) || k.title?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && k.year === yearFilter;
  });

  const grouped = {};
  filteredKpis.forEach(k => {
    if (!grouped[k.employee_id]) grouped[k.employee_id] = { kpis: [], name: k.employee_name };
    grouped[k.employee_id].kpis.push(k);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === form.employee_id);
    await base44.entities.KPI.create({ ...form, employee_name: emp?.full_name || "", weight: Number(form.weight) });
    toast.success("KPI added");
    setShowForm(false);
    setForm({ employee_id: "", title: "", description: "", weight: "", target: "", year: new Date().getFullYear().toString() });
    load();
  };

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
          <h1 className="text-2xl font-bold">KPI Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Set and evaluate KPIs with weighted scores</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Add KPI</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total KPIs" value={kpis.filter(k => k.year === yearFilter).length} icon={Target} />
        <StatsCard title="Employees Tracked" value={Object.keys(grouped).length} icon={Star} />
        <StatsCard title="Evaluations Done" value={evaluations.filter(e => e.year === yearFilter && e.status === "Completed").length} icon={Star} />
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([empId, { kpis: empKpis, name }]) => {
          const totalWeight = empKpis.reduce((s, k) => s + (k.weight || 0), 0);
          const eval_ = evaluations.find(e => e.employee_id === empId && e.year === yearFilter);
          return (
            <div key={empId} className="bg-card rounded-xl border">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-xs">{name?.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{empKpis.length} KPIs • Total weight: <span className={totalWeight === 100 ? "text-emerald-600" : "text-amber-600"}>{totalWeight}%</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {eval_ && (
                    <Badge variant="outline" className={eval_.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                      {eval_.status === "Completed" ? `Score: ${eval_.final_score?.toFixed(1)}%` : eval_.status}
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedEmpId(selectedEmpId === empId ? null : empId)}>
                    {selectedEmpId === empId ? "Close" : "Evaluate"}
                  </Button>
                </div>
              </div>
              <div className="px-5 py-3 space-y-2">
                {empKpis.map(kpi => (
                  <div key={kpi.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="h-7 w-7 rounded bg-primary/5 flex items-center justify-center shrink-0">
                      <Target className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{kpi.title}</p>
                      {kpi.description && <p className="text-xs text-muted-foreground">{kpi.description}</p>}
                      {kpi.target && <p className="text-xs text-muted-foreground">Target: {kpi.target}</p>}
                    </div>
                    <Badge variant="outline">{kpi.weight}%</Badge>
                  </div>
                ))}
              </div>
              {selectedEmpId === empId && (
                <div className="border-t px-5 py-4">
                  <KPIEvaluationPanel
                    employeeId={empId}
                    employeeName={name}
                    kpis={empKpis}
                    year={yearFilter}
                    existing={eval_}
                    onSaved={() => { setSelectedEmpId(null); load(); }}
                  />
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No KPIs found. Add KPIs for your employees.</div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add KPI</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={v => setForm(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>KPI Title *</Label>
              <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>Target</Label>
              <Input value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} placeholder="e.g. Complete 10 projects" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (%) *</Label>
                <Input type="number" required min="1" max="100" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
              <div>
                <Label>Year *</Label>
                <Input value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Add KPI</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
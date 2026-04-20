import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import StatsCard from "../components/StatsCard";

const statusColors = {
  Draft: "bg-slate-50 text-slate-600 border-slate-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Bonus() {
  const [bonuses, setBonuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [form, setForm] = useState({ employee_id: "", year: new Date().getFullYear().toString(), bonus_amount: "", supervisor_notes: "", hr_notes: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [b, emps, evals] = await Promise.all([
      base44.entities.AnnualBonus.list("-created_date"),
      base44.entities.Employee.list(),
      base44.entities.KPIEvaluation.filter({ status: "Completed" }),
    ]);
    setBonuses(b);
    setEmployees(emps);
    setEvaluations(evals);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = [...new Set([...bonuses.map(b => b.year), new Date().getFullYear().toString()])];
  const filtered = bonuses.filter(b => b.year === yearFilter);
  const totalPaid = filtered.filter(b => b.status === "Paid").reduce((s, b) => s + (b.bonus_amount || 0), 0);

  const getKpiScore = (empId) => {
    const eval_ = evaluations.find(e => e.employee_id === empId && e.year === form.year);
    return eval_?.final_score || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const emp = employees.find(e => e.id === form.employee_id);
    const kpiScore = getKpiScore(form.employee_id);
    await base44.entities.AnnualBonus.create({
      ...form,
      employee_name: emp?.full_name || "",
      company: emp?.company || "",
      base_salary: emp?.base_salary || 0,
      kpi_score: kpiScore,
      bonus_amount: Number(form.bonus_amount),
      status: "Draft",
    });
    toast.success("Bonus record created");
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.AnnualBonus.update(id, { status });
    toast.success(`Bonus marked as ${status.toLowerCase()}`);
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
          <h1 className="text-2xl font-bold">Annual Bonus</h1>
          <p className="text-sm text-muted-foreground mt-1">KPI-based annual bonuses evaluated by Supervisor & HR</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Bonus</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Paid Bonuses" value={`JOD ${totalPaid.toLocaleString()}`} icon={Star} />
        <StatsCard title="Bonus Records" value={filtered.length} icon={Star} />
        <StatsCard title="Approved" value={filtered.filter(b => b.status === "Approved" || b.status === "Paid").length} icon={Star} />
      </div>

      <div className="flex items-center gap-3">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">KPI Score</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base Salary</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bonus</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.employee_name}</p>
                    {b.supervisor_notes && <p className="text-xs text-muted-foreground">{b.supervisor_notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{b.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS"}</td>
                  <td className="px-4 py-3 text-right">
                    {b.kpi_score != null ? (
                      <span className={`font-semibold ${b.kpi_score >= 80 ? "text-emerald-600" : b.kpi_score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                        {b.kpi_score}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">JOD {(b.base_salary || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">JOD {(b.bonus_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <Select value={b.status} onValueChange={v => handleStatusChange(b.id, v)}>
                      <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No bonus records for {yearFilter}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Annual Bonus</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={v => { setForm(p => ({ ...p, employee_id: v })); }}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.employee_id && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p>KPI Score ({form.year}): <strong>{getKpiScore(form.employee_id) != null ? `${getKpiScore(form.employee_id)}%` : "Not evaluated yet"}</strong></p>
                <p>Base Salary: <strong>JOD {(employees.find(e => e.id === form.employee_id)?.base_salary || 0).toLocaleString()}</strong></p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year *</Label>
                <Input value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </div>
              <div>
                <Label>Bonus Amount (JOD) *</Label>
                <Input type="number" required value={form.bonus_amount} onChange={e => setForm(p => ({ ...p, bonus_amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Supervisor Notes</Label>
              <Input value={form.supervisor_notes} onChange={e => setForm(p => ({ ...p, supervisor_notes: e.target.value }))} />
            </div>
            <div>
              <Label>HR Notes</Label>
              <Input value={form.hr_notes} onChange={e => setForm(p => ({ ...p, hr_notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Bonus"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
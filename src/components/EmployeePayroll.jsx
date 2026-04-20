import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const statusColors = {
  Draft: "bg-slate-50 text-slate-600 border-slate-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function EmployeePayroll({ employeeId, employeeName, company, baseSalary }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    month: "", housing_allowance: 0, transport_allowance: 0,
    other_allowances: 0, overtime: 0, deductions: 0, gosi_deduction: 0, notes: "",
  });

  const load = async () => {
    const data = await base44.entities.PayrollRecord.filter({ employee_id: employeeId }, "-month");
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [employeeId]);

  const calcNet = () => {
    const base = baseSalary || 0;
    const allowances = Number(form.housing_allowance) + Number(form.transport_allowance) + Number(form.other_allowances) + Number(form.overtime);
    const deduct = Number(form.deductions) + Number(form.gosi_deduction);
    return base + allowances - deduct;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.PayrollRecord.create({
      ...form,
      employee_id: employeeId,
      employee_name: employeeName,
      company,
      base_salary: baseSalary || 0,
      housing_allowance: Number(form.housing_allowance),
      transport_allowance: Number(form.transport_allowance),
      other_allowances: Number(form.other_allowances),
      overtime: Number(form.overtime),
      deductions: Number(form.deductions),
      gosi_deduction: Number(form.gosi_deduction),
      net_salary: calcNet(),
      status: "Draft",
    });
    toast.success("Payroll record created");
    setSaving(false);
    setShowForm(false);
    setForm({ month: "", housing_allowance: 0, transport_allowance: 0, other_allowances: 0, overtime: 0, deductions: 0, gosi_deduction: 0, notes: "" });
    load();
  };

  const handleStatusChange = async (record, status) => {
    await base44.entities.PayrollRecord.update(record.id, { status });
    toast.success(`Payroll marked as ${status.toLowerCase()}`);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Payroll Records</h3>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Payroll
        </Button>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No payroll records</p>
      ) : (
        <div className="space-y-3">
          {records.map(rec => (
            <div key={rec.id} className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{rec.month}</p>
                  <Badge variant="outline" className={statusColors[rec.status] || ""}>{rec.status}</Badge>
                </div>
                <Select value={rec.status} onValueChange={v => handleStatusChange(rec, v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Base</span><p className="font-medium">JOD {(rec.base_salary || 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Allowances</span><p className="font-medium">JOD {((rec.housing_allowance || 0) + (rec.transport_allowance || 0) + (rec.other_allowances || 0)).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Deductions</span><p className="font-medium text-red-600">JOD {((rec.deductions || 0) + (rec.gosi_deduction || 0)).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Net Salary</span><p className="font-bold text-primary">JOD {(rec.net_salary || 0).toLocaleString()}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payroll Record</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Month (YYYY-MM) *</Label>
              <Input required placeholder="2026-04" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Base Salary:</span>
              <span className="ml-2 font-semibold">JOD {(baseSalary || 0).toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Housing Allowance</Label><Input type="number" value={form.housing_allowance} onChange={e => setForm(p => ({ ...p, housing_allowance: e.target.value }))} /></div>
              <div><Label>Transport Allowance</Label><Input type="number" value={form.transport_allowance} onChange={e => setForm(p => ({ ...p, transport_allowance: e.target.value }))} /></div>
              <div><Label>Other Allowances</Label><Input type="number" value={form.other_allowances} onChange={e => setForm(p => ({ ...p, other_allowances: e.target.value }))} /></div>
              <div><Label>Overtime</Label><Input type="number" value={form.overtime} onChange={e => setForm(p => ({ ...p, overtime: e.target.value }))} /></div>
              <div><Label>Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm(p => ({ ...p, deductions: e.target.value }))} /></div>
              <div><Label>GOSI Deduction</Label><Input type="number" value={form.gosi_deduction} onChange={e => setForm(p => ({ ...p, gosi_deduction: e.target.value }))} /></div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
              <span className="text-muted-foreground">Net Salary:</span>
              <span className="ml-2 font-bold text-primary">JOD {calcNet().toLocaleString()}</span>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Record"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
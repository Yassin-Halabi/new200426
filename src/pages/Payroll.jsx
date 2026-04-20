import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Wallet, CheckCircle, Printer, Calculator, RotateCcw, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import StatsCard from "../components/StatsCard";
import PayslipModal from "../components/PayslipModal";
import moment from "moment";

const statusColors = {
  Draft: "bg-slate-50 text-slate-600 border-slate-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function calcSalary(r) {
  const totalDue = (r.base_salary || 0) + (r.transport_allowance || 0) + (r.kpi_bonus || 0) + (r.salary_variance || 0) + (r.other_allowances || 0);
  const ssEmployee = Math.round((r.base_salary || 0) * 0.075 * 100) / 100;
  const ssCompany = Math.round((r.base_salary || 0) * 0.1425 * 100) / 100;
  const net = totalDue - ssEmployee - (r.income_tax || 0) - (r.loan || 0) - (r.health_insurance || 0) - (r.other_deductions || 0);
  return { totalDue, ssEmployee, ssCompany, net };
}

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(moment().format("YYYY-MM"));
  const [user, setUser] = useState(null);
  const [printRecord, setPrintRecord] = useState(null);
  const [calcMonth, setCalcMonth] = useState(moment().format("YYYY-MM"));
  const [showCalcDialog, setShowCalcDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({
    employee_id: "", month: moment().format("YYYY-MM"),
    transport_allowance: 0, kpi_bonus: 0, salary_variance: 0,
    other_allowances: 0, income_tax: 0, loan: 0, health_insurance: 0, other_deductions: 0, notes: ""
  });

  const load = async () => {
    const [data, emps, me] = await Promise.all([
      base44.entities.PayrollRecord.list("-month"),
      base44.entities.Employee.list(),
      base44.auth.me(),
    ]);
    setRecords(data);
    setEmployees(emps);
    setUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isAdmin = user?.role === "admin";
  const months = [...new Set(records.map(r => r.month))].sort().reverse();
  const filtered = records.filter(r => {
    const matchSearch = r.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchMonth = !monthFilter || r.month === monthFilter;
    return matchSearch && matchStatus && matchMonth;
  });

  const monthRecords = records.filter(r => r.month === monthFilter);
  const totalNet = monthRecords.reduce((s, r) => s + (r.net_salary || 0), 0);
  const totalPaid = records.filter(r => r.status === "Paid").reduce((s, r) => s + (r.net_salary || 0), 0);

  const handleGMApprove = async (rec) => {
    await base44.entities.PayrollRecord.update(rec.id, { gm_approved: true, gm_approved_by: user?.email, status: "Approved" });
    toast.success("Payroll approved by GM");
    load();
  };

  const handleStatusChange = async (rec, status) => {
    await base44.entities.PayrollRecord.update(rec.id, { status });
    load();
  };

  // Auto-calculate salaries for all active employees for a given month
  const handleCalculate = async () => {
    setCalculating(true);
    const activeEmps = employees.filter(e => e.status === "Active" || e.status === "Probation");
    const existing = records.filter(r => r.month === calcMonth).map(r => r.employee_id);
    let created = 0;
    for (const emp of activeEmps) {
      if (existing.includes(emp.id)) continue;
      const base = { base_salary: emp.base_salary || 0, transport_allowance: 0, kpi_bonus: 0, salary_variance: 0, other_allowances: 0, income_tax: 0, loan: 0, health_insurance: 0, other_deductions: 0 };
      const { totalDue, ssEmployee, ssCompany, net } = calcSalary(base);
      await base44.entities.PayrollRecord.create({
        employee_id: emp.id,
        employee_name: emp.full_name,
        company: emp.company,
        month: calcMonth,
        base_salary: emp.base_salary || 0,
        transport_allowance: 0, kpi_bonus: 0, salary_variance: 0, other_allowances: 0,
        total_due_salary: totalDue,
        social_security_employee: ssEmployee,
        social_security_company: ssCompany,
        income_tax: 0, loan: 0, health_insurance: 0, other_deductions: 0,
        net_salary: net,
        status: "Draft",
        is_calculated: true,
        calculation_batch: calcMonth,
      });
      created++;
    }
    toast.success(`Created ${created} payroll records for ${calcMonth}`);
    setShowCalcDialog(false);
    setMonthFilter(calcMonth);
    setCalculating(false);
    load();
  };

  const handleUndo = async () => {
    if (!isAdmin) { toast.error("Only admins can undo salary calculation"); return; }
    const batch = records.filter(r => r.month === monthFilter && r.is_calculated);
    for (const r of batch) {
      await base44.entities.PayrollRecord.delete(r.id);
    }
    toast.success(`Removed ${batch.length} auto-calculated records for ${monthFilter}`);
    load();
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === form.employee_id);
    const base = { base_salary: emp?.base_salary || 0, ...form };
    const { totalDue, ssEmployee, ssCompany, net } = calcSalary({ ...base, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v) || 0])) });
    await base44.entities.PayrollRecord.create({
      employee_id: form.employee_id,
      employee_name: emp?.full_name || "",
      company: emp?.company || "",
      month: form.month,
      base_salary: emp?.base_salary || 0,
      transport_allowance: Number(form.transport_allowance) || 0,
      kpi_bonus: Number(form.kpi_bonus) || 0,
      salary_variance: Number(form.salary_variance) || 0,
      other_allowances: Number(form.other_allowances) || 0,
      total_due_salary: totalDue,
      social_security_employee: ssEmployee,
      social_security_company: ssCompany,
      income_tax: Number(form.income_tax) || 0,
      loan: Number(form.loan) || 0,
      health_insurance: Number(form.health_insurance) || 0,
      other_deductions: Number(form.other_deductions) || 0,
      net_salary: net,
      status: "Draft",
      notes: form.notes,
    });
    toast.success("Payroll record created");
    setShowAddDialog(false);
    load();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const r = editRecord;
    const base = {
      base_salary: r.base_salary || 0,
      transport_allowance: Number(r.transport_allowance) || 0,
      kpi_bonus: Number(r.kpi_bonus) || 0,
      salary_variance: Number(r.salary_variance) || 0,
      other_allowances: Number(r.other_allowances) || 0,
      income_tax: Number(r.income_tax) || 0,
      loan: Number(r.loan) || 0,
      health_insurance: Number(r.health_insurance) || 0,
      other_deductions: Number(r.other_deductions) || 0,
    };
    const { totalDue, ssEmployee, ssCompany, net } = calcSalary(base);
    await base44.entities.PayrollRecord.update(r.id, {
      ...base,
      total_due_salary: totalDue,
      social_security_employee: ssEmployee,
      social_security_company: ssCompany,
      net_salary: net,
      notes: r.notes,
    });
    toast.success("Record updated");
    setEditRecord(null);
    load();
  };

  const getEmployee = (id) => employees.find(e => e.id === id);

  const hasBatch = records.filter(r => r.month === monthFilter && r.is_calculated).length > 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const fmt = (n) => `${(Number(n) || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">Basic + Allowances = Total Due − SS (7.5%) − Tax − Loan − Health = Net Salary</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Record
          </Button>
          <Button onClick={() => setShowCalcDialog(true)} className="gap-2">
            <Calculator className="h-4 w-4" /> Calculate Salaries
          </Button>
          {isAdmin && hasBatch && (
            <Button variant="destructive" onClick={handleUndo} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Undo Calculation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Month Net Total" value={`JOD ${fmt(totalNet)}`} subtitle={`${monthRecords.length} records`} icon={Wallet} />
        <StatsCard title="All-Time Paid" value={`JOD ${fmt(totalPaid)}`} icon={Wallet} />
        <StatsCard title="Company SS (14.25%)" value={`JOD ${fmt(monthRecords.reduce((s, r) => s + (r.social_security_company || 0), 0))}`} subtitle="This month" icon={Wallet} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Months" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Months</SelectItem>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs">Employee</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs">Month</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">Basic</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">Total Due</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">SS Emp.</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">SS Co.</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">Tax</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">Loan</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">Net</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">GM</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => (
                <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-xs">{rec.employee_name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{rec.month}</td>
                  <td className="px-3 py-2.5 text-right text-xs">{fmt(rec.base_salary)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium">{fmt(rec.total_due_salary || rec.base_salary)}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-red-600">{fmt(rec.social_security_employee)}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-amber-600">{fmt(rec.social_security_company)}</td>
                  <td className="px-3 py-2.5 text-right text-xs">{fmt(rec.income_tax)}</td>
                  <td className="px-3 py-2.5 text-right text-xs">{fmt(rec.loan)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-primary">{fmt(rec.net_salary)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {isAdmin ? (
                      <Select value={rec.status} onValueChange={v => handleStatusChange(rec, v)}>
                        <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={statusColors[rec.status] || ""}>{rec.status}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {rec.gm_approved ? (
                      <span className="text-xs text-emerald-600 flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> OK</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleGMApprove(rec)} className="h-7 text-xs">Approve</Button>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditRecord({ ...rec })} className="h-7 text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setPrintRecord({ rec, emp: getEmployee(rec.employee_id) })} className="h-7 text-xs">
                        <Printer className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-8 text-muted-foreground">No payroll records found</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-primary/5 border-t-2 border-primary/20">
                  <td colSpan={3} className="px-3 py-2.5 text-xs font-bold">TOTAL ({filtered.length} records)</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold">{fmt(filtered.reduce((s, r) => s + (r.total_due_salary || r.base_salary || 0), 0))}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-red-600">{fmt(filtered.reduce((s, r) => s + (r.social_security_employee || 0), 0))}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-amber-600">{fmt(filtered.reduce((s, r) => s + (r.social_security_company || 0), 0))}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold">{fmt(filtered.reduce((s, r) => s + (r.income_tax || 0), 0))}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold">{fmt(filtered.reduce((s, r) => s + (r.loan || 0), 0))}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-primary">{fmt(filtered.reduce((s, r) => s + (r.net_salary || 0), 0))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Calculate Dialog */}
      <Dialog open={showCalcDialog} onOpenChange={setShowCalcDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Calculate Salaries</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This will auto-generate payroll records for all active employees for the selected month. Records can only be undone by an Admin.</p>
            <div>
              <Label>Month</Label>
              <Input type="month" value={calcMonth} onChange={e => setCalcMonth(e.target.value)} />
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              ⚠️ Formula: Basic + Allowances = Total Due − SS 7.5% − Tax − Loan − Health = Net Salary<br />
              Social Security (Company): 14.25% of Basic Salary
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCalcDialog(false)}>Cancel</Button>
              <Button onClick={handleCalculate} disabled={calculating}>
                <Calculator className="h-4 w-4 mr-1" />
                {calculating ? "Calculating..." : "Run Calculation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Manual Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Payroll Record</DialogTitle></DialogHeader>
          <form onSubmit={handleAddManual} className="space-y-3">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={v => setForm(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month</Label>
              <Input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["transport_allowance","Transport Allowance"],["kpi_bonus","KPI Bonus"],["salary_variance","Salary Variance"],["other_allowances","Other Allowances"],["income_tax","Income Tax"],["loan","Loan"],["health_insurance","Health Insurance"],["other_deductions","Other Deductions"]].map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input type="number" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit">Create Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      {editRecord && (
        <Dialog open onOpenChange={() => setEditRecord(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit: {editRecord.employee_name} — {editRecord.month}</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[["transport_allowance","Transport Allowance"],["kpi_bonus","KPI Bonus"],["salary_variance","Salary Variance"],["other_allowances","Other Allowances"],["income_tax","Income Tax (manual)"],["loan","Loan"],["health_insurance","Health Insurance"],["other_deductions","Other Deductions"]].map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="number" value={editRecord[key] || 0} onChange={e => setEditRecord(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              {(() => {
                const { totalDue, ssEmployee, ssCompany, net } = calcSalary({ ...editRecord, ...Object.fromEntries(Object.entries(editRecord).map(([k, v]) => [k, Number(v) || 0])) });
                return (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                    <p>Total Due: <strong>JOD {totalDue.toFixed(2)}</strong></p>
                    <p>SS Employee (7.5%): <span className="text-red-600">JOD {ssEmployee.toFixed(2)}</span></p>
                    <p>SS Company (14.25%): <span className="text-amber-600">JOD {ssCompany.toFixed(2)}</span></p>
                    <p>Net Salary: <strong className="text-primary">JOD {net.toFixed(2)}</strong></p>
                  </div>
                );
              })()}
              <div>
                <Label>Notes</Label>
                <Input value={editRecord.notes || ""} onChange={e => setEditRecord(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {printRecord && (
        <PayslipModal record={printRecord.rec} employee={printRecord.emp} onClose={() => setPrintRecord(null)} />
      )}
    </div>
  );
}
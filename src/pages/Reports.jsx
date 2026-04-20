import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const fmt = (n) => `JOD ${(Number(n) || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Reports() {
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [history, setHistory] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(moment().format("YYYY-MM"));
  const [yearFilter, setYearFilter] = useState(moment().year().toString());
  const [empFilter, setEmpFilter] = useState("all");
  const printRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list(),
      base44.entities.PayrollRecord.list("-month"),
      base44.entities.LeaveRequest.list("-created_date"),
      base44.entities.EmployeeHistory.list("-date"),
      base44.entities.KPI.list(),
      base44.entities.AnnualBonus.list("-created_date"),
      base44.entities.KPIEvaluation.list("-created_date"),
    ]).then(([emps, pay, lv, hist, k, bon, evals]) => {
      setEmployees(emps);
      setPayroll(pay);
      setLeaves(lv);
      setHistory(hist);
      setKpis(k);
      setBonuses(bon);
      setEvaluations(evals);
      setLoading(false);
    });
  }, []);

  const handlePrint = (title) => {
    const content = printRef.current?.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${title}</title><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:12px}
      h1{color:#1e4d7b;font-size:18px;margin-bottom:4px}
      .meta{color:#666;font-size:11px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th{background:#1e4d7b;color:white;padding:7px 10px;text-align:left;font-size:11px}
      td{padding:6px 10px;border-bottom:1px solid #eee;font-size:11px}
      tr:nth-child(even) td{background:#f8f9fa}
      .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
      .footer{margin-top:30px;border-top:1px solid #ddd;padding-top:10px;font-size:10px;color:#888;display:flex;justify-content:space-between}
      @media print{body{padding:15px}}
    </style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const months = [...new Set(payroll.map(r => r.month))].sort().reverse();
  const years = [...new Set([...payroll.map(r => r.month?.slice(0, 4)), moment().year().toString()])].sort().reverse();

  const activeEmps = employees.filter(e => e.status === "Active" || e.status === "On Leave" || e.status === "Probation");
  const recentJoined = employees.filter(e => e.join_date && moment(e.join_date).isAfter(moment().subtract(90, "days")));
  const recentLeft = employees.filter(e => e.status === "Terminated");

  const monthPayroll = payroll.filter(r => r.month === monthFilter);
  const yearPayroll = payroll.filter(r => r.month?.startsWith(yearFilter));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const PrintWrapper = ({ title, subtitle, children }) => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Button onClick={() => handlePrint(title)} className="gap-2" size="sm">
          <Printer className="h-4 w-4" /> Print / Export
        </Button>
      </div>
      <div ref={printRef}>
        <div className="header-print" style={{display:"none"}}>
          <h1>AMS Analytix HR — {title}</h1>
          <div className="meta">Generated: {moment().format("MMMM D, YYYY")} | {subtitle}</div>
        </div>
        {children}
        <div className="footer-print" style={{display:"none"}}>
          <div className="footer">
            <span>AMS Analytix HR System</span>
            <span>Confidential</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Table = ({ headers, rows, emptyMsg = "No data" }) => (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b">
            {headers.map((h, i) => <th key={i} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={headers.length} className="text-center py-8 text-muted-foreground">{emptyMsg}</td></tr>
            : rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                {row.map((cell, j) => <td key={j} className="px-4 py-2.5">{cell}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Printable HR reports for management</p>
      </div>

      <Tabs defaultValue="staff-details">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="staff-details">Staff Details</TabsTrigger>
          <TabsTrigger value="recently-joined">Recently Joined</TabsTrigger>
          <TabsTrigger value="recently-left">Recently Left</TabsTrigger>
          <TabsTrigger value="staff-history">Staff History</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="monthly-payroll">Monthly Payroll</TabsTrigger>
          <TabsTrigger value="annual-payroll">Annual Payroll</TabsTrigger>
          <TabsTrigger value="kpi-bonus">KPIs & Bonus</TabsTrigger>
        </TabsList>

        {/* Staff Details */}
        <TabsContent value="staff-details" className="mt-6">
          <PrintWrapper title="Staff Details Report" subtitle={`Total: ${activeEmps.length} active employees`}>
            <Table
              headers={["#", "Name", "ID", "Position", "Department", "Company", "Join Date", "Status", "Basic Salary"]}
              rows={activeEmps.map((e, i) => [
                i + 1,
                e.full_name,
                e.employee_id || "—",
                e.position,
                e.department || "—",
                e.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS",
                e.join_date ? moment(e.join_date).format("DD MMM YYYY") : "—",
                <Badge key={e.id} variant="outline" className={e.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{e.status}</Badge>,
                fmt(e.base_salary),
              ])}
            />
          </PrintWrapper>
        </TabsContent>

        {/* Recently Joined */}
        <TabsContent value="recently-joined" className="mt-6">
          <PrintWrapper title="Recently Joined Staff" subtitle="Staff who joined in the last 90 days">
            <Table
              headers={["Name", "Position", "Department", "Company", "Join Date", "Days Since Joining"]}
              rows={recentJoined.map(e => [
                e.full_name,
                e.position,
                e.department || "—",
                e.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS",
                moment(e.join_date).format("DD MMM YYYY"),
                `${moment().diff(moment(e.join_date), "days")} days`,
              ])}
              emptyMsg="No staff joined in the last 90 days"
            />
          </PrintWrapper>
        </TabsContent>

        {/* Recently Left */}
        <TabsContent value="recently-left" className="mt-6">
          <PrintWrapper title="Staff Who Left AMS" subtitle="Terminated employees">
            <Table
              headers={["Name", "Employee ID", "Position", "Department", "Company", "Join Date", "Last Salary"]}
              rows={recentLeft.map(e => [
                e.full_name,
                e.employee_id || "—",
                e.position,
                e.department || "—",
                e.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS",
                e.join_date ? moment(e.join_date).format("DD MMM YYYY") : "—",
                fmt(e.base_salary),
              ])}
              emptyMsg="No terminated employees"
            />
          </PrintWrapper>
        </TabsContent>

        {/* Staff History */}
        <TabsContent value="staff-history" className="mt-6">
          <div className="flex gap-3 mb-4">
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <PrintWrapper title="Staff History Report" subtitle={empFilter === "all" ? "All employees" : employees.find(e => e.id === empFilter)?.full_name}>
            <Table
              headers={["Employee", "Event Type", "Description", "Date", "Recorded By"]}
              rows={history.filter(h => empFilter === "all" || h.employee_id === empFilter).map(h => [
                h.employee_name,
                <Badge key={h.id} variant="outline">{h.event_type}</Badge>,
                h.description,
                moment(h.date).format("DD MMM YYYY"),
                h.recorded_by || "—",
              ])}
            />
          </PrintWrapper>
        </TabsContent>

        {/* Leaves */}
        <TabsContent value="leaves" className="mt-6">
          <div className="flex gap-3 mb-4 flex-wrap">
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <PrintWrapper title="Staff Annual Leaves Report" subtitle="All leave requests">
            <Table
              headers={["Employee", "Type", "From", "To", "Days", "Reason", "Status"]}
              rows={leaves.filter(l => empFilter === "all" || l.employee_id === empFilter).map(l => [
                l.employee_name,
                l.leave_type,
                moment(l.start_date).format("DD MMM YYYY"),
                moment(l.end_date).format("DD MMM YYYY"),
                l.days_count,
                l.reason || "—",
                <Badge key={l.id} variant="outline" className={l.status === "Approved" ? "bg-emerald-50 text-emerald-700" : l.status === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}>{l.status}</Badge>,
              ])}
            />
          </PrintWrapper>
        </TabsContent>

        {/* Monthly Payroll */}
        <TabsContent value="monthly-payroll" className="mt-6">
          <div className="flex gap-3 mb-4">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <PrintWrapper title={`Monthly Payroll Report — ${monthFilter}`} subtitle={`${monthPayroll.length} records | Total Net: ${fmt(monthPayroll.reduce((s, r) => s + (r.net_salary || 0), 0))}`}>
            <Table
              headers={["Employee", "Company", "Basic", "Transport", "KPI Bonus", "Variance", "Other", "Total Due", "SS Employee (7.5%)", "SS Company (14.25%)", "Tax", "Loan", "Health Ins.", "Net Salary", "Status"]}
              rows={monthPayroll.map(r => [
                r.employee_name,
                r.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS",
                fmt(r.base_salary),
                fmt(r.transport_allowance),
                fmt(r.kpi_bonus),
                fmt(r.salary_variance),
                fmt(r.other_allowances),
                fmt(r.total_due_salary),
                fmt(r.social_security_employee),
                fmt(r.social_security_company),
                fmt(r.income_tax),
                fmt(r.loan),
                fmt(r.health_insurance),
                <strong key={r.id}>{fmt(r.net_salary)}</strong>,
                r.status,
              ])}
            />
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Total Basic</p><p className="font-bold">{fmt(monthPayroll.reduce((s, r) => s + (r.base_salary || 0), 0))}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Due</p><p className="font-bold">{fmt(monthPayroll.reduce((s, r) => s + (r.total_due_salary || 0), 0))}</p></div>
              <div><p className="text-xs text-muted-foreground">Total SS Company</p><p className="font-bold">{fmt(monthPayroll.reduce((s, r) => s + (r.social_security_company || 0), 0))}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Net Salary</p><p className="font-bold text-primary">{fmt(monthPayroll.reduce((s, r) => s + (r.net_salary || 0), 0))}</p></div>
            </div>
          </PrintWrapper>
        </TabsContent>

        {/* Annual Payroll */}
        <TabsContent value="annual-payroll" className="mt-6">
          <div className="flex gap-3 mb-4">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <PrintWrapper title={`Annual Payroll Report — ${yearFilter}`} subtitle={`${yearPayroll.length} records`}>
            {/* Group by employee */}
            {(() => {
              const grouped = {};
              yearPayroll.forEach(r => {
                if (!grouped[r.employee_id]) grouped[r.employee_id] = { name: r.employee_name, company: r.company, records: [] };
                grouped[r.employee_id].records.push(r);
              });
              return (
                <Table
                  headers={["Employee", "Company", "Months Paid", "Total Basic", "Total Due", "Total SS (Company)", "Total Deductions", "Total Net"]}
                  rows={Object.values(grouped).map(g => {
                    const totalBasic = g.records.reduce((s, r) => s + (r.base_salary || 0), 0);
                    const totalDue = g.records.reduce((s, r) => s + (r.total_due_salary || r.base_salary || 0), 0);
                    const totalSSCo = g.records.reduce((s, r) => s + (r.social_security_company || 0), 0);
                    const totalDed = g.records.reduce((s, r) => s + (r.social_security_employee || 0) + (r.income_tax || 0) + (r.loan || 0) + (r.health_insurance || 0), 0);
                    const totalNet = g.records.reduce((s, r) => s + (r.net_salary || 0), 0);
                    return [
                      g.name,
                      g.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS",
                      g.records.length,
                      fmt(totalBasic),
                      fmt(totalDue),
                      fmt(totalSSCo),
                      fmt(totalDed),
                      <strong key={g.name}>{fmt(totalNet)}</strong>,
                    ];
                  })}
                />
              );
            })()}
          </PrintWrapper>
        </TabsContent>

        {/* KPIs & Bonus */}
        <TabsContent value="kpi-bonus" className="mt-6">
          <div className="flex gap-3 mb-4">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <PrintWrapper title={`KPIs & Annual Bonus Report — ${yearFilter}`} subtitle="">
            <Table
              headers={["Employee", "Company", "KPI Score", "Supervisor Score", "HR Score", "Final Score", "Bonus Amount", "Bonus Status"]}
              rows={bonuses.filter(b => b.year === yearFilter).map(b => {
                const eval_ = evaluations.find(e => e.employee_id === b.employee_id && e.year === yearFilter);
                return [
                  b.employee_name,
                  b.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS",
                  eval_ ? `${eval_.supervisor_score || "—"}%` : "—",
                  eval_ ? `${eval_.supervisor_score || "—"}%` : "—",
                  eval_ ? `${eval_.hr_score || "—"}%` : "—",
                  eval_?.final_score ? <strong key={b.id}>{eval_.final_score}%</strong> : "—",
                  <strong key={b.id + "_amt"}>{fmt(b.bonus_amount)}</strong>,
                  <Badge key={b.id + "_st"} variant="outline" className={b.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{b.status}</Badge>,
                ];
              })}
            />
          </PrintWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}
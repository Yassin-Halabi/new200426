import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Wallet, CalendarDays, FileText, Building2 } from "lucide-react";
import StatsCard from "../components/StatsCard";
import RecentActivity from "../components/RecentActivity";
import CompanyBreakdown from "../components/CompanyBreakdown";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [emps, lvs, pay] = await Promise.all([
        base44.entities.Employee.list(),
        base44.entities.LeaveRequest.list("-created_date", 10),
        base44.entities.PayrollRecord.list("-created_date", 10),
      ]);
      setEmployees(emps);
      setLeaves(lvs);
      setPayroll(pay);
      setLoading(false);
    }
    load();
  }, []);

  const activeEmps = employees.filter(e => e.status === "Active").length;
  const onLeave = employees.filter(e => e.status === "On Leave").length;
  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
  const totalPayroll = payroll.filter(p => p.status === "Paid").reduce((s, p) => s + (p.net_salary || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome to AMS Analytix HR Management System</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Employees" value={employees.length} subtitle={`${activeEmps} active`} icon={Users} />
        <StatsCard title="On Leave" value={onLeave} subtitle={`${pendingLeaves} pending requests`} icon={CalendarDays} />
        <StatsCard title="Monthly Payroll" value={`JOD ${totalPayroll.toLocaleString()}`} subtitle="Last processed" icon={Wallet} />
        <StatsCard title="Companies" value="2" subtitle="Under AMS Analytix" icon={Building2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompanyBreakdown employees={employees} />
        <RecentActivity leaves={leaves} payroll={payroll} />
      </div>
    </div>
  );
}
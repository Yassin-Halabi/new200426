import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, CalendarDays, Check, X, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import StatsCard from "../components/StatsCard";
import moment from "moment";

const statusColors = {
  "Pending Supervisor": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending HR": "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLeave, setActionLeave] = useState(null);
  const [actionType, setActionType] = useState(null); // "supervisor" | "hr"
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);

  const load = async () => {
    const [data, emps, me] = await Promise.all([
      base44.entities.LeaveRequest.list("-created_date"),
      base44.entities.Employee.list(),
      base44.auth.me(),
    ]);
    setLeaves(data);
    setEmployees(emps);
    setUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isAdmin = user?.role === "admin";

  const pending = leaves.filter(l => l.status === "Pending Supervisor" || l.status === "Pending HR").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const totalDays = leaves.filter(l => l.status === "Approved").reduce((s, l) => s + (l.days_count || 0), 0);

  const filtered = leaves.filter(l => {
    const matchSearch = l.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAction = (leave, type) => {
    setActionLeave(leave);
    setActionType(type);
    setComment("");
  };

  const handleAction = async (decision) => {
    const leave = actionLeave;
    let updates = {};

    if (actionType === "supervisor") {
      if (decision === "Approved") {
        updates = { supervisor_status: "Approved", supervisor_comment: comment, status: "Pending HR" };
      } else {
        updates = { supervisor_status: "Rejected", supervisor_comment: comment, status: "Rejected" };
      }
    } else {
      if (decision === "Approved") {
        // Check annual leave limit
        const emp = employees.find(e => e.id === leave.employee_id);
        if (leave.leave_type === "Annual" && emp) {
          const maxDays = emp.max_annual_leave_days || emp.annual_leave_balance || 21;
          const year = moment(leave.start_date).year().toString();
          const usedLeaves = leaves.filter(l =>
            l.employee_id === leave.employee_id &&
            l.id !== leave.id &&
            l.status === "Approved" &&
            l.leave_type === "Annual" &&
            moment(l.start_date).year().toString() === year
          );
          const usedDays = usedLeaves.reduce((s, l) => s + (l.days_count || 0), 0);
          if (usedDays + leave.days_count > maxDays) {
            toast.error(`Exceeds annual leave limit (${maxDays} days). Used: ${usedDays} days.`);
            setActionLeave(null);
            return;
          }
        }
        updates = { hr_status: "Approved", hr_comment: comment, status: "Approved", approved_by: user?.email };
      } else {
        updates = { hr_status: "Rejected", hr_comment: comment, status: "Rejected" };
      }
    }

    await base44.entities.LeaveRequest.update(leave.id, updates);
    toast.success(`Leave ${decision.toLowerCase()}`);
    setActionLeave(null);
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
      <div>
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Two-step approval: Supervisor → HR</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Pending Approval" value={pending} icon={CalendarDays} />
        <StatsCard title="Approved" value={approved} icon={CalendarDays} />
        <StatsCard title="Total Approved Days" value={totalDays} icon={CalendarDays} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending Supervisor">Pending Supervisor</SelectItem>
            <SelectItem value="Pending HR">Pending HR</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(leave => {
          const isSupervisorPending = leave.status === "Pending Supervisor";
          const isHRPending = leave.status === "Pending HR";

          return (
            <div key={leave.id} className="bg-card rounded-xl border p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-xs">
                      {leave.employee_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{leave.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.leave_type} Leave • {leave.days_count} days •{" "}
                      {moment(leave.start_date).format("MMM D")} – {moment(leave.end_date).format("MMM D, YYYY")}
                    </p>
                    {leave.reason && <p className="text-xs text-muted-foreground mt-0.5">{leave.reason}</p>}
                    <div className="flex gap-3 mt-1">
                      {leave.supervisor_comment && (
                        <p className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Supervisor:</span> {leave.supervisor_comment}
                        </p>
                      )}
                      {leave.hr_comment && (
                        <p className="text-[11px] text-muted-foreground">
                          <span className="font-medium">HR:</span> {leave.hr_comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={statusColors[leave.status] || ""}>{leave.status}</Badge>
                  {isSupervisorPending && (
                    <Button size="sm" variant="outline" onClick={() => openAction(leave, "supervisor")} className="gap-1 text-xs">
                      <MessageSquare className="h-3 w-3" /> Supervisor Review
                    </Button>
                  )}
                  {isHRPending && isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => openAction(leave, "hr")} className="gap-1 text-xs">
                      <MessageSquare className="h-3 w-3" /> HR Final Approval
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No leave requests found</div>
        )}
      </div>

      <Dialog open={!!actionLeave} onOpenChange={() => setActionLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "supervisor" ? "Supervisor Review" : "HR Final Approval"}</DialogTitle>
          </DialogHeader>
          {actionLeave && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><span className="font-medium">Employee:</span> {actionLeave.employee_name}</p>
                <p><span className="font-medium">Leave:</span> {actionLeave.leave_type} • {actionLeave.days_count} days</p>
                <p><span className="font-medium">Dates:</span> {moment(actionLeave.start_date).format("MMM D")} – {moment(actionLeave.end_date).format("MMM D, YYYY")}</p>
              </div>
              <div>
                <Label>Comment (optional)</Label>
                <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActionLeave(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleAction("Rejected")}>
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleAction("Approved")}>
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import moment from "moment";

const statusColors = {
  "Pending Supervisor": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending HR": "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function EmployeeLeaves({ employeeId, employeeName, company, leaveBalance }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: "Annual", start_date: "", end_date: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.LeaveRequest.filter({ employee_id: employeeId }, "-created_date");
    setLeaves(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [employeeId]);

  const usedDays = leaves.filter(l => l.status === "Approved" && l.leave_type === "Annual").reduce((s, l) => s + (l.days_count || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const start = moment(form.start_date);
    const end = moment(form.end_date);
    const days = end.diff(start, "days") + 1;
    await base44.entities.LeaveRequest.create({
      ...form,
      employee_id: employeeId,
      employee_name: employeeName,
      company,
      days_count: days,
      status: "Pending Supervisor",
      supervisor_status: "Pending",
      hr_status: "Pending",
    });
    toast.success("Leave request submitted");
    setSaving(false);
    setShowForm(false);
    setForm({ leave_type: "Annual", start_date: "", end_date: "", reason: "" });
    load();
  };

  const handleAction = async (leave, decision) => {
    await base44.entities.LeaveRequest.update(leave.id, { status: decision });
    toast.success(`Leave ${decision.toLowerCase()}`);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Leave Requests</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Balance: {leaveBalance - usedDays} / {leaveBalance} days remaining</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Request Leave
        </Button>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(100, (usedDays / leaveBalance) * 100)}%` }}
        />
      </div>

      {leaves.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No leave requests</p>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => (
            <div key={leave.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{leave.leave_type} Leave</p>
                  <Badge variant="outline" className={statusColors[leave.status] || ""}>{leave.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {moment(leave.start_date).format("MMM D")} – {moment(leave.end_date).format("MMM D, YYYY")} • {leave.days_count} days
                </p>
                {leave.reason && <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>}
              </div>
              {leave.status === "Pending" && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleAction(leave, "Approved")} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleAction(leave, "Rejected")} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Leave Type</Label>
              <Select value={form.leave_type} onValueChange={v => setForm(p => ({ ...p, leave_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Annual", "Sick", "Unpaid", "Emergency", "Maternity", "Paternity"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" required value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" required value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
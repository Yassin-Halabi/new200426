import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import moment from "moment";

const eventColors = {
  Promotion: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Salary Change": "bg-blue-50 text-blue-700 border-blue-200",
  Warning: "bg-red-50 text-red-700 border-red-200",
  Commendation: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Bonus Paid": "bg-purple-50 text-purple-700 border-purple-200",
};

export default function EmployeeHistoryTab({ employeeId, employeeName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ event_type: "", description: "", date: "", recorded_by: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.EmployeeHistory.filter({ employee_id: employeeId }, "-date");
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.EmployeeHistory.create({ ...form, employee_id: employeeId, employee_name: employeeName });
    toast.success("History entry added");
    setSaving(false);
    setShowForm(false);
    setForm({ event_type: "", description: "", date: "", recorded_by: "" });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Employee History</h3>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Entry
        </Button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No history records yet</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="relative pl-10">
                <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={eventColors[item.event_type] || ""}>{item.event_type}</Badge>
                        <span className="text-xs text-muted-foreground">{moment(item.date).format("MMM D, YYYY")}</span>
                      </div>
                      <p className="text-sm">{item.description}</p>
                      {item.recorded_by && <p className="text-xs text-muted-foreground mt-1">Recorded by: {item.recorded_by}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add History Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Event Type *</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["Promotion", "Salary Change", "Department Change", "Warning", "Commendation", "Contract Renewal", "Leave Taken", "Bonus Paid", "Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description *</Label>
              <Input required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label>Recorded By</Label>
                <Input value={form.recorded_by} onChange={e => setForm(p => ({ ...p, recorded_by: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Entry"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
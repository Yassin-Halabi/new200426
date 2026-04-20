import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function EmployeeFormDialog({ open, onClose, onSaved, employee }) {
  const [form, setForm] = useState(employee || {
    full_name: "", email: "", phone: "", company: "", department: "",
    position: "", employee_id: "", join_date: "", status: "Active",
    base_salary: "", nationality: "", national_id: "",
    bank_name: "", iban: "", annual_leave_balance: 21, max_annual_leave_days: 21,
    emergency_contact_name: "", emergency_contact_phone: "",
    supervisor_name: "", supervisor_email: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      base_salary: Number(form.base_salary) || 0,
      annual_leave_balance: Number(form.annual_leave_balance) || 21,
      max_annual_leave_days: Number(form.max_annual_leave_days) || 21,
    };
    if (employee?.id) {
      await base44.entities.Employee.update(employee.id, data);
      toast.success("Employee updated");
    } else {
      await base44.entities.Employee.create(data);
      toast.success("Employee added");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input required value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
            </div>
            <div>
              <Label>Company *</Label>
              <Select value={form.company} onValueChange={v => handleChange("company", v)}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Al Mithalia for Advanced Market Studies">Al Mithalia</SelectItem>
                  <SelectItem value="Advanced Marketing Statistics">AMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Input value={form.department} onChange={e => handleChange("department", e.target.value)} />
            </div>
            <div>
              <Label>Position *</Label>
              <Input required value={form.position} onChange={e => handleChange("position", e.target.value)} />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input value={form.employee_id} onChange={e => handleChange("employee_id", e.target.value)} />
            </div>
            <div>
              <Label>Join Date</Label>
              <Input type="date" value={form.join_date} onChange={e => handleChange("join_date", e.target.value)} />
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={v => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Probation">Probation</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Base Salary (JOD)</Label>
              <Input type="number" value={form.base_salary} onChange={e => handleChange("base_salary", e.target.value)} />
            </div>
            <div>
              <Label>Annual Leave Balance</Label>
              <Input type="number" value={form.annual_leave_balance} onChange={e => handleChange("annual_leave_balance", e.target.value)} />
            </div>
            <div>
              <Label>Max Annual Leave Days/Year</Label>
              <Input type="number" value={form.max_annual_leave_days} onChange={e => handleChange("max_annual_leave_days", e.target.value)} />
            </div>
            <div>
              <Label>Nationality</Label>
              <Input value={form.nationality} onChange={e => handleChange("nationality", e.target.value)} />
            </div>
            <div>
              <Label>National ID / Iqama</Label>
              <Input value={form.national_id} onChange={e => handleChange("national_id", e.target.value)} />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input value={form.bank_name} onChange={e => handleChange("bank_name", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>IBAN</Label>
              <Input value={form.iban} onChange={e => handleChange("iban", e.target.value)} />
            </div>
            <div>
              <Label>Direct Supervisor Name</Label>
              <Input value={form.supervisor_name} onChange={e => handleChange("supervisor_name", e.target.value)} />
            </div>
            <div>
              <Label>Direct Supervisor Email</Label>
              <Input value={form.supervisor_email} onChange={e => handleChange("supervisor_email", e.target.value)} />
            </div>
            <div>
              <Label>Emergency Contact Name</Label>
              <Input value={form.emergency_contact_name} onChange={e => handleChange("emergency_contact_name", e.target.value)} />
            </div>
            <div>
              <Label>Emergency Contact Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={e => handleChange("emergency_contact_phone", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : employee ? "Update" : "Add Employee"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
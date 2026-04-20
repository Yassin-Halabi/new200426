import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Pencil, Trash2, FileText, CalendarDays, Wallet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import EmployeeFormDialog from "../components/EmployeeFormDialog";
import EmployeeDocuments from "../components/EmployeeDocuments";
import EmployeeLeaves from "../components/EmployeeLeaves";
import EmployeePayroll from "../components/EmployeePayroll";
import EmployeeHistoryTab from "../components/EmployeeHistoryTab";

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-200",
  Terminated: "bg-red-50 text-red-700 border-red-200",
  Probation: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    const emps = await base44.entities.Employee.filter({ id });
    if (emps.length) setEmployee(emps[0]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    await base44.entities.Employee.delete(employee.id);
    toast.success("Employee deleted");
    navigate("/employees");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center py-16 text-muted-foreground">Employee not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/employees")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Button>

      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-xl">
              {employee.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-card-foreground">{employee.full_name}</h1>
                <p className="text-sm text-muted-foreground">{employee.position} • {employee.department || "No department"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {employee.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[employee.status] || ""}>{employee.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          {[
            { label: "Employee ID", value: employee.employee_id || "—" },
            { label: "Email", value: employee.email || "—" },
            { label: "Phone", value: employee.phone || "—" },
            { label: "Join Date", value: employee.join_date || "—" },
            { label: "Base Salary", value: employee.base_salary ? `JOD ${employee.base_salary.toLocaleString()}` : "—" },
            { label: "Leave Balance", value: `${employee.annual_leave_balance ?? 21} days` },
            { label: "Nationality", value: employee.nationality || "—" },
            { label: "National ID", value: employee.national_id || "—" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
              <p className="text-sm font-medium text-card-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" /> Documents</TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2"><CalendarDays className="h-4 w-4" /> Leaves</TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2"><Wallet className="h-4 w-4" /> Payroll</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" /> History</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          <EmployeeDocuments employeeId={employee.id} employeeName={employee.full_name} />
        </TabsContent>
        <TabsContent value="leaves">
          <EmployeeLeaves employeeId={employee.id} employeeName={employee.full_name} company={employee.company} leaveBalance={employee.annual_leave_balance ?? 21} />
        </TabsContent>
        <TabsContent value="payroll">
          <EmployeePayroll employeeId={employee.id} employeeName={employee.full_name} company={employee.company} baseSalary={employee.base_salary} />
        </TabsContent>
        <TabsContent value="history">
          <EmployeeHistoryTab employeeId={employee.id} employeeName={employee.full_name} />
        </TabsContent>
      </Tabs>

      {showEdit && (
        <EmployeeFormDialog
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={load}
          employee={employee}
        />
      )}
    </div>
  );
}
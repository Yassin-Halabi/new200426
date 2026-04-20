import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import moment from "moment";

export default function PayslipModal({ record, employee, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Payslip - ${record.employee_name} - ${record.month}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #1e4d7b; padding-bottom: 20px; }
            .logo-area h1 { color: #1e4d7b; font-size: 24px; margin: 0; }
            .logo-area p { color: #666; font-size: 12px; margin: 4px 0; }
            .payslip-title { font-size: 20px; font-weight: bold; color: #1e4d7b; text-align: right; }
            .section { margin: 20px 0; }
            .section-title { background: #1e4d7b; color: white; padding: 6px 12px; font-size: 12px; font-weight: bold; margin-bottom: 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 7px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
            td:last-child { text-align: right; font-weight: 500; }
            .total-row td { background: #f0f5ff; font-weight: bold; font-size: 14px; }
            .net-row td { background: #1e4d7b; color: white; font-size: 15px; font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; color: #666; }
            .emp-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .emp-info div { font-size: 13px; }
            .emp-info .label { color: #666; font-size: 11px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const earnings = (record.housing_allowance || 0) + (record.transport_allowance || 0) + (record.other_allowances || 0) + (record.overtime || 0);
  const deductions = (record.deductions || 0) + (record.gosi_deduction || 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Payslip Preview</h2>
          <Button onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" /> Print Payslip</Button>
        </div>

        <div ref={printRef}>
          <div className="header">
            <div className="logo-area">
              <h1>AMS ANALYTIX</h1>
              <p>Al Mithalia for Advanced Market Studies</p>
              <p>Advanced Marketing Statistics</p>
            </div>
            <div>
              <div className="payslip-title">PAY SLIP</div>
              <p style={{textAlign:"right", color:"#666", fontSize:"12px", marginTop:"4px"}}>Month: {record.month}</p>
              <p style={{textAlign:"right", color:"#666", fontSize:"12px"}}>Issued: {moment().format("MMM D, YYYY")}</p>
            </div>
          </div>

          <div className="section">
            <div className="section-title">EMPLOYEE INFORMATION</div>
            <div className="emp-info" style={{padding:"10px 12px", background:"#f9f9f9"}}>
              <div><div className="label">Employee Name</div><div>{record.employee_name}</div></div>
              <div><div className="label">Employee ID</div><div>{employee?.employee_id || "—"}</div></div>
              <div><div className="label">Position</div><div>{employee?.position || "—"}</div></div>
              <div><div className="label">Department</div><div>{employee?.department || "—"}</div></div>
              <div><div className="label">Company</div><div>{record.company === "Al Mithalia for Advanced Market Studies" ? "Al Mithalia" : "AMS"}</div></div>
              <div><div className="label">Bank / IBAN</div><div>{employee?.bank_name || "—"}</div></div>
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", margin:"20px 0"}}>
            <div className="section">
              <div className="section-title">EARNINGS</div>
              <table>
                <tbody>
                  <tr><td>Basic Salary</td><td>JOD {(record.base_salary || 0).toLocaleString()}</td></tr>
                  <tr><td>Housing Allowance</td><td>JOD {(record.housing_allowance || 0).toLocaleString()}</td></tr>
                  <tr><td>Transport Allowance</td><td>JOD {(record.transport_allowance || 0).toLocaleString()}</td></tr>
                  <tr><td>Other Allowances</td><td>JOD {(record.other_allowances || 0).toLocaleString()}</td></tr>
                  <tr><td>Overtime</td><td>JOD {(record.overtime || 0).toLocaleString()}</td></tr>
                  <tr className="total-row"><td>Total Earnings</td><td>JOD {((record.base_salary || 0) + earnings).toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="section">
              <div className="section-title">DEDUCTIONS</div>
              <table>
                <tbody>
                  <tr><td>Deductions</td><td>JOD {(record.deductions || 0).toLocaleString()}</td></tr>
                  <tr><td>GOSI / Social Security</td><td>JOD {(record.gosi_deduction || 0).toLocaleString()}</td></tr>
                  <tr className="total-row"><td>Total Deductions</td><td>JOD {deductions.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <table>
            <tbody>
              <tr className="net-row"><td>NET SALARY</td><td>JOD {(record.net_salary || 0).toLocaleString()}</td></tr>
            </tbody>
          </table>

          {record.notes && (
            <div style={{marginTop:"16px", padding:"10px 12px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"6px", fontSize:"12px"}}>
              <strong>Notes:</strong> {record.notes}
            </div>
          )}

          <div className="footer">
            <div>
              <p>GM Approval: {record.gm_approved ? `✓ ${record.gm_approved_by || "Approved"}` : "Pending"}</p>
              <p>Status: {record.status}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p>AMS Analytix HR System</p>
              <p>Confidential — For employee use only</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
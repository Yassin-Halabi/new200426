import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import moment from "moment";

export default function EmployeeDocuments({ employeeId, employeeName }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ document_name: "", document_type: "", direction: "Internal", notes: "" });
  const fileRef = useRef(null);

  const load = async () => {
    const data = await base44.entities.HRDocument.filter({ employee_id: employeeId }, "-created_date");
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [employeeId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Please select a file"); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.HRDocument.create({
      ...form,
      employee_id: employeeId,
      employee_name: employeeName,
      file_url,
    });
    toast.success("Document uploaded");
    setUploading(false);
    setShowUpload(false);
    setForm({ document_name: "", document_type: "", direction: "Internal", notes: "" });
    load();
  };

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document?")) return;
    await base44.entities.HRDocument.delete(docId);
    toast.success("Document deleted");
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">HR Documents</h3>
        <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="h-3.5 w-3.5" /> Upload Document
        </Button>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No documents yet</p>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.document_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{doc.document_type}</Badge>
                  <span className="text-[11px] text-muted-foreground">{doc.direction}</span>
                  <span className="text-[11px] text-muted-foreground">• {moment(doc.created_date).format("MMM D, YYYY")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label>Document Name *</Label>
              <Input required value={form.document_name} onChange={e => setForm(p => ({ ...p, document_name: e.target.value }))} />
            </div>
            <div>
              <Label>Document Type *</Label>
              <Select value={form.document_type} onValueChange={v => setForm(p => ({ ...p, document_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["Contract", "ID Copy", "Offer Letter", "Warning Letter", "Salary Certificate", "Experience Letter", "Medical Report", "Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={v => setForm(p => ({ ...p, direction: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uploaded by Employee">Uploaded by Employee</SelectItem>
                  <SelectItem value="Sent to Employee">Sent to Employee</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File *</Label>
              <Input type="file" ref={fileRef} required />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, FileText, Download, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StatsCard from "../components/StatsCard";
import moment from "moment";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = async () => {
    const data = await base44.entities.HRDocument.list("-created_date");
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = docs.filter(d => {
    const matchSearch = d.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.document_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document?")) return;
    await base44.entities.HRDocument.delete(docId);
    toast.success("Document deleted");
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
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">All HR documents across the organization</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Documents" value={docs.length} icon={FileText} />
        <StatsCard title="Contracts" value={docs.filter(d => d.document_type === "Contract").length} icon={FileText} />
        <StatsCard title="This Month" value={docs.filter(d => moment(d.created_date).isSame(moment(), "month")).length} icon={FileText} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["Contract", "ID Copy", "Offer Letter", "Warning Letter", "Salary Certificate", "Experience Letter", "Medical Report", "Other"].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Document</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Direction</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium truncate max-w-[200px]">{doc.document_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.employee_name}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{doc.document_type}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{doc.direction || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{moment(doc.created_date).format("MMM D, YYYY")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No documents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
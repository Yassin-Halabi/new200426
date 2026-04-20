import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function KPIEvaluationPanel({ employeeId, employeeName, kpis, year, existing, onSaved }) {
  const isCompleted = existing?.status === "Completed";
  const [supervisorScores, setSupervisorScores] = useState(
    kpis.reduce((acc, k) => ({ ...acc, [k.id]: existing?.supervisor_score || "" }), {})
  );
  const [supervisorComment, setSupervisorComment] = useState(existing?.supervisor_comment || "");
  const [hrScore, setHrScore] = useState(existing?.hr_score || "");
  const [hrComment, setHrComment] = useState(existing?.hr_comment || "");
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  });

  const isAdmin = user?.role === "admin";

  const calcWeightedScore = (scores) => {
    let total = 0;
    let totalWeight = 0;
    kpis.forEach(k => {
      const score = Number(scores[k.id] || 0);
      total += score * (k.weight / 100);
      totalWeight += k.weight;
    });
    return totalWeight > 0 ? (total * 100 / totalWeight).toFixed(1) : 0;
  };

  const handleSaveSupervisor = async () => {
    setSaving(true);
    const weightedScore = calcWeightedScore(supervisorScores);
    const data = {
      kpi_id: kpis[0]?.id,
      employee_id: employeeId,
      employee_name: employeeName,
      year,
      supervisor_score: Number(weightedScore),
      supervisor_comment: supervisorComment,
      status: "Pending HR",
    };
    if (existing?.id) {
      await base44.entities.KPIEvaluation.update(existing.id, data);
    } else {
      await base44.entities.KPIEvaluation.create(data);
    }
    toast.success("Supervisor evaluation saved");
    setSaving(false);
    onSaved();
  };

  const handleFinalizeHR = async () => {
    setSaving(true);
    const finalScore = ((Number(existing?.supervisor_score || 0) + Number(hrScore)) / 2).toFixed(1);
    await base44.entities.KPIEvaluation.update(existing.id, {
      hr_score: Number(hrScore),
      hr_comment: hrComment,
      final_score: Number(finalScore),
      status: "Completed",
    });
    toast.success("HR evaluation completed. Final score: " + finalScore + "%");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Evaluation Panel — {year}</h4>

      {!existing || existing.status === "Pending Supervisor" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Supervisor Scoring (score each KPI 0–100)</p>
          {kpis.map(k => (
            <div key={k.id} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm">{k.title} <span className="text-muted-foreground text-xs">({k.weight}%)</span></p>
              </div>
              <Input
                type="number" min="0" max="100"
                className="w-24"
                value={supervisorScores[k.id] || ""}
                onChange={e => setSupervisorScores(p => ({ ...p, [k.id]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <Label>Comment</Label>
            <Input value={supervisorComment} onChange={e => setSupervisorComment(e.target.value)} placeholder="Overall comment..." />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Weighted Score: <span className="font-bold text-primary">{calcWeightedScore(supervisorScores)}%</span></p>
            <Button onClick={handleSaveSupervisor} disabled={saving}>{saving ? "Saving..." : "Submit Supervisor Evaluation"}</Button>
          </div>
        </div>
      ) : existing?.status === "Pending HR" && isAdmin ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium">Supervisor Score: {existing.supervisor_score}%</p>
            {existing.supervisor_comment && <p className="text-muted-foreground mt-1">{existing.supervisor_comment}</p>}
          </div>
          <div>
            <Label>HR Score (0–100)</Label>
            <Input type="number" min="0" max="100" value={hrScore} onChange={e => setHrScore(e.target.value)} />
          </div>
          <div>
            <Label>HR Comment</Label>
            <Input value={hrComment} onChange={e => setHrComment(e.target.value)} placeholder="HR final comment..." />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Final (avg): <span className="font-bold text-primary">{hrScore ? (((existing.supervisor_score || 0) + Number(hrScore)) / 2).toFixed(1) : "—"}%</span>
            </p>
            <Button onClick={handleFinalizeHR} disabled={saving || !hrScore}>{saving ? "Saving..." : "Finalize HR Evaluation"}</Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-sm">
          <p className="font-semibold text-emerald-700">Evaluation Completed</p>
          <p>Supervisor Score: <strong>{existing?.supervisor_score}%</strong></p>
          <p>HR Score: <strong>{existing?.hr_score}%</strong></p>
          <p>Final Score: <strong className="text-emerald-700">{existing?.final_score}%</strong></p>
          {existing?.hr_comment && <p className="text-muted-foreground">{existing.hr_comment}</p>}
        </div>
      )}
    </div>
  );
}
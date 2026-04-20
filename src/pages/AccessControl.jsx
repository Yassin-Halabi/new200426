import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import StatsCard from "../components/StatsCard";

export default function AccessControl() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    const [data, me] = await Promise.all([
      base44.entities.User.list(),
      base44.auth.me(),
    ]);
    setUsers(data);
    setCurrentUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isAdmin = currentUser?.role === "admin";

  const handleRoleChange = async (user, role) => {
    await base44.entities.User.update(user.id, { role });
    toast.success(`${user.full_name}'s role updated to ${role}`);
    load();
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviting(false);
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = users.filter(u => u.role === "admin").length;
  const regularUsers = users.filter(u => u.role !== "admin").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Shield className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">Access restricted to administrators only.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage staff system access and roles</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Users" value={users.length} icon={Shield} />
        <StatsCard title="Admins (HR)" value={admins} icon={UserCheck} />
        <StatsCard title="Regular Users" value={regularUsers} icon={UserX} />
      </div>

      {/* Invite User */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold mb-4">Invite New User</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Email address"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User (Staff)</SelectItem>
              <SelectItem value="admin">Admin (HR)</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviting} className="gap-2">
            {inviting ? "Sending..." : "Send Invite"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Admin (HR)</strong> — Full access: payroll, leaves approval, reports, access control.<br />
          <strong>User (Staff)</strong> — Limited access: view own profile, submit leave requests.
        </p>
      </div>

      {/* User List */}
      <div className="bg-card rounded-xl border">
        <div className="px-5 py-4 border-b flex items-center gap-3">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-xs">
                          {u.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <span className="font-medium">{u.full_name}</span>
                      {u.id === currentUser?.id && <Badge variant="outline" className="text-[10px]">You</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted"}>
                      {u.role === "admin" ? "Admin (HR)" : "User (Staff)"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <Select value={u.role || "user"} onValueChange={v => handleRoleChange(u, v)}>
                        <SelectTrigger className="w-[150px] h-7 text-xs ml-auto"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User (Staff)</SelectItem>
                          <SelectItem value="admin">Admin (HR)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import { useProjectMembers, useProjectInvitations, useInviteTeamMember, useRemoveTeamMember, useUpdateMemberRole, useRevokeInvitation, useActivityLog } from "@/hooks/use-team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Plus, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function TeamCollaborationDialog({ projectId }: { projectId: number }) {
  const { data: members = [], isLoading: membersLoading } = useProjectMembers(projectId);
  const { data: invitations = [], isLoading: invitationsLoading } = useProjectInvitations(projectId);
  const { data: activityLogs = [], isLoading: logsLoading } = useActivityLog(projectId);
  
  const inviteTeamMember = useInviteTeamMember();
  const removeTeamMember = useRemoveTeamMember();
  const updateMemberRole = useUpdateMemberRole();
  const revokeInvitation = useRevokeInvitation();
  
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"editor" | "viewer">("editor");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const isOwner = members.some(m => m.role === "owner");

  const handleInvite = () => {
    if (!newEmail) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    inviteTeamMember.mutate(
      { projectId, email: newEmail, role: newRole },
      {
        onSuccess: () => {
          setNewEmail("");
          setNewRole("editor");
          toast({
            title: "Invitation sent",
            description: `${newEmail} has been invited to the project.`,
          });
        },
      }
    );
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/10">
          <Users className="w-4 h-4 mr-2" />
          Team
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Collaboration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/20">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="space-y-4">
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No team members yet</p>
              ) : (
                members.map((member) => (
                  <Card key={member.id} className="bg-black/20 border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">{member.userName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role !== "owner" && isOwner && (
                          <>
                            <Select value={member.role} onValueChange={(role: any) => updateMemberRole.mutate({ projectId, memberId: member.id, role })}>
                              <SelectTrigger className="w-24 bg-black/40 border-white/10 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1c2128] border-white/10">
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-xs h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => removeTeamMember.mutate({ projectId, memberId: member.id })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {member.role === "owner" && (
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">Owner</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {isOwner && (
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-sm font-medium">Add Team Member</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="team@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-black/20 border-white/10"
                    onKeyPress={(e) => e.key === "Enter" && handleInvite()}
                  />
                  <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                    <SelectTrigger className="w-24 bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c2128] border-white/10">
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={inviteTeamMember.isPending} className="bg-primary hover:bg-primary/90">
                    {inviteTeamMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {invitationsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending invitations</p>
            ) : (
              invitations.map((inv) => (
                <Card key={inv.id} className="bg-black/20 border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Role: <span className="capitalize">{inv.role}</span> • Expires {format(new Date(inv.expiresAt), "MMM d")}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(inv.token, inv.id)}
                      >
                        {copiedId === inv.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => revokeInvitation.mutate({ projectId, invitationId: inv.id })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              activityLogs.slice(0, 20).map((log, i) => (
                <div key={i} className="text-sm border-b border-white/5 pb-3">
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(log.timestamp), "MMM d, HH:mm")}
                  </p>
                  <p className="text-white font-medium mt-1">{log.userName}</p>
                  <p className="text-muted-foreground text-xs">{log.description}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

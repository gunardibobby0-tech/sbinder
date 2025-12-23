import { useProject } from "@/hooks/use-projects";
import { useRoute, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, FileText, Users, CalendarDays, Settings, DollarSign, BarChart3, Film, Images, Layers, Plus, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import ScriptView from "./project-views/script-view";
import ContactsView from "./project-views/contacts-view";
import ScheduleView from "./project-views/schedule-view";
import BudgetView from "./project-views/budget-view";
import TimelineView from "./project-views/timeline-view";
import ShotListView from "./project-views/shot-list-view";
import StoryboardView from "./project-views/storyboard-view";
import StripboardView from "./project-views/stripboard-view";

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const projectId = parseInt(params?.id || "0");
  const { data: project, isLoading } = useProject(projectId);
  const { toast } = useToast();
  
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"editor" | "viewer">("editor");

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  if (!project) {
    return (
      <LayoutShell>
        <div className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
        </div>
      </LayoutShell>
    );
  }

  const handleInviteTeam = () => {
    if (!newEmail) {
      toast({ title: "Email required", description: "Please enter an email address.", variant: "destructive" });
      return;
    }
    toast({ title: "Invitation sent", description: `${newEmail} has been invited to the project.` });
    setNewEmail("");
    setNewRole("editor");
    setTeamDialogOpen(false);
  };

  return (
    <LayoutShell>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] lg:h-screen">
        {/* Project Header */}
        <div className="bg-[#1c2128] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/dashboard")}
              className="text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <span>{project.type}</span>
                <span className="w-1 h-1 rounded-full bg-primary" />
                <span>{project.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Users className="w-4 h-4 mr-2" />
                  Team
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Team Collaboration</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="members" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="invite">Invite</TabsTrigger>
                  </TabsList>
                  <TabsContent value="members" className="space-y-3 mt-4">
                    <Card className="bg-black/20 border-white/10 p-4">
                      <p className="font-medium text-white">Project Owner</p>
                      <p className="text-xs text-muted-foreground mt-1">You are the owner of this project</p>
                    </Card>
                  </TabsContent>
                  <TabsContent value="invite" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input 
                          placeholder="team@example.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-black/20 border-white/10 mt-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                          <SelectTrigger className="bg-black/20 border-white/10 mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1c2128] border-white/10">
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleInviteTeam} className="w-full bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="hidden sm:flex border-white/10">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Project Tabs */}
        <Tabs defaultValue="script" className="flex-1 flex flex-col">
          <div className="border-b border-white/5 bg-[#1c2128]/50 backdrop-blur px-6 overflow-x-auto">
            <TabsList className="h-12 bg-transparent p-0 space-x-6">
              <TabsTrigger 
                value="script" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" />
                Script
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <Users className="w-4 h-4 mr-2" />
                Cast & Crew
              </TabsTrigger>
              <TabsTrigger 
                value="budget" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Budget
              </TabsTrigger>
              <TabsTrigger 
                value="shots" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <Film className="w-4 h-4 mr-2" />
                Shot List
              </TabsTrigger>
              <TabsTrigger 
                value="storyboards" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <Images className="w-4 h-4 mr-2" />
                Storyboards
              </TabsTrigger>
              <TabsTrigger 
                value="stripboard" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-medium whitespace-nowrap"
              >
                <Layers className="w-4 h-4 mr-2" />
                Stripboard
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 bg-background overflow-hidden relative">
            <TabsContent value="script" className="h-full m-0 p-0 overflow-auto">
              <ScriptView projectId={projectId} />
            </TabsContent>
            <TabsContent value="schedule" className="h-full m-0 p-0 overflow-auto">
              <ScheduleView projectId={projectId} />
            </TabsContent>
            <TabsContent value="timeline" className="h-full m-0 p-0 overflow-auto">
              <TimelineView projectId={projectId} />
            </TabsContent>
            <TabsContent value="contacts" className="h-full m-0 p-0 overflow-auto">
              <ContactsView projectId={projectId} />
            </TabsContent>
            <TabsContent value="budget" className="h-full m-0 p-0 overflow-auto">
              <BudgetView projectId={projectId} />
            </TabsContent>
            <TabsContent value="shots" className="h-full m-0 p-0 overflow-auto">
              <ShotListView projectId={projectId} />
            </TabsContent>
            <TabsContent value="storyboards" className="h-full m-0 p-0 overflow-auto">
              <StoryboardView projectId={projectId} />
            </TabsContent>
            <TabsContent value="stripboard" className="h-full m-0 p-0 overflow-auto">
              <StripboardView projectId={projectId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

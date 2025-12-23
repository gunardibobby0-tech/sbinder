import { useProject } from "@/hooks/use-projects";
import { useRoute, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText, Users, CalendarDays, Settings, DollarSign, BarChart3, Film, Images } from "lucide-react";
import ScriptView from "./project-views/script-view";
import ContactsView from "./project-views/contacts-view";
import ScheduleView from "./project-views/schedule-view";
import BudgetView from "./project-views/budget-view";
import TimelineView from "./project-views/timeline-view";
import ShotListView from "./project-views/shot-list-view";
import StoryboardView from "./project-views/storyboard-view";

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const projectId = parseInt(params?.id || "0");
  const { data: project, isLoading } = useProject(projectId);

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
          </div>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

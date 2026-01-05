import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { Loader2, Plus, Film, Search, Calendar, MoreVertical } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LayoutShell>
      <div className="px-content py-content max-w-7xl mx-auto space-comfortable animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white">Projects</h1>
            <p className="text-muted-foreground text-base mt-2 leading-relaxed">Manage your productions, scripts, and schedules.</p>
          </div>
          <CreateProjectDialog />
        </div>

        <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-white/5">
          <Search className="w-5 h-5 text-muted-foreground ml-2" />
          <Input 
            placeholder="Search projects..." 
            className="border-none bg-transparent focus-visible:ring-0 text-lg h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects?.length === 0 ? (
          <div className="text-center py-24 bg-card/50 rounded-2xl border border-dashed border-white/10">
            <Film className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Start your next masterpiece by creating a new project workspace.
            </p>
            <CreateProjectDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects?.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 bg-card border-white/5 overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative">
                    {/* Placeholder for project thumbnail */}
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Film className="w-12 h-12 text-white/10" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-black/50 backdrop-blur rounded-full text-xs font-medium text-white border border-white/10 uppercase tracking-wider">
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wide font-medium">
                          {project.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Created {format(new Date(project.createdAt!), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}

function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateProject();
  
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      type: "Film",
      status: "development",
      ownerId: "1", // This will be overwritten by backend auth usually, but schema needs it
    },
  });

  const onSubmit = (data: InsertProject) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. The Grand Adventure" className="bg-black/20 border-white/10 focus-visible:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                      <SelectItem value="Film">Film</SelectItem>
                      <SelectItem value="TV Series">TV Series</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Music Video">Music Video</SelectItem>
                      <SelectItem value="Documentary">Documentary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

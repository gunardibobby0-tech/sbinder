import { useShotList, useCreateShotListItem, useUpdateShotListItem, useDeleteShotListItem } from "@/hooks/use-shot-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShotListSchema } from "@shared/schema";
import { Loader2, Plus, Trash2, Film, Eye } from "lucide-react";
import { useState } from "react";
import type { ShotList } from "@shared/schema";

const SHOT_TYPES = ["Wide", "Medium", "Close-up", "Extreme Close-up", "Aerial", "POV", "Over-the-shoulder"];
const PRIORITIES = ["high", "medium", "low"];
const STATUSES = ["planned", "shot", "approved"];

export default function ShotListView({ projectId }: { projectId: number }) {
  const { data: shots = [], isLoading } = useShotList(projectId);
  const createShot = useCreateShotListItem();
  const updateShot = useUpdateShotListItem();
  const deleteShot = useDeleteShotListItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<ShotList | null>(null);

  const form = useForm({
    resolver: zodResolver(insertShotListSchema),
    defaultValues: {
      projectId,
      sceneNumber: "",
      description: "",
      shotType: "Medium",
      duration: "",
      location: "",
      equipment: "",
      notes: "",
      priority: "medium",
      status: "planned",
    },
  });

  const handleSave = (data: any) => {
    if (editingShot) {
      updateShot.mutate(
        { id: editingShot.id, projectId, updates: data },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingShot(null);
            form.reset();
          },
        }
      );
    } else {
      createShot.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset({
            projectId,
            sceneNumber: "",
            description: "",
            shotType: "Medium",
            duration: "",
            location: "",
            equipment: "",
            notes: "",
            priority: "medium",
            status: "planned",
          });
        },
      });
    }
  };

  const openEditDialog = (shot: ShotList) => {
    setEditingShot(shot);
    form.reset(shot);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Shot List Breakdown</h2>
          <p className="text-sm text-muted-foreground mt-1">Plan and organize shots for your production</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setEditingShot(null);
                form.reset({
                  projectId,
                  sceneNumber: "",
                  description: "",
                  shotType: "Medium",
                  duration: "",
                  location: "",
                  equipment: "",
                  notes: "",
                  priority: "medium",
                  status: "planned",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Shot
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingShot ? "Edit Shot" : "Add New Shot"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sceneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scene #</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1A" className="bg-black/20 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shotType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shot Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                            {SHOT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Shot description and action" className="bg-black/20 border-white/10 min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="30 sec" className="bg-black/20 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Studio/Exterior" className="bg-black/20 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="equipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Needed</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Crane, Steadicam, etc." className="bg-black/20 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes..." className="bg-black/20 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createShot.isPending || updateShot.isPending} className="w-full bg-primary hover:bg-primary/90">
                  {(createShot.isPending || updateShot.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingShot ? "Update Shot" : "Add Shot"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {shots.length === 0 ? (
        <Card className="bg-black/20 border-dashed border-white/10 p-12 text-center">
          <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No shots planned yet. Start building your shot list.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shots.map((shot) => (
            <Card key={shot.id} className="bg-black/20 border-white/5 p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-blue-400">Scene {shot.sceneNumber}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {shot.shotType}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      shot.priority === "high" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                      shot.priority === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                      "bg-green-500/20 text-green-400 border-green-500/30"
                    }`}>
                      {shot.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      shot.status === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      shot.status === "shot" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                      "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }`}>
                      {shot.status}
                    </span>
                  </div>

                  <p className="text-white font-medium mb-2">{shot.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    {shot.duration && <div><span className="font-semibold">Duration:</span> {shot.duration}</div>}
                    {shot.location && <div><span className="font-semibold">Location:</span> {shot.location}</div>}
                    {shot.equipment && <div className="col-span-2"><span className="font-semibold">Equipment:</span> {shot.equipment}</div>}
                  </div>

                  {shot.notes && <p className="text-xs text-muted-foreground mt-2 italic">{shot.notes}</p>}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(shot)}
                    className="text-muted-foreground hover:text-blue-400"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteShot.mutate({ id: shot.id, projectId })}
                    disabled={deleteShot.isPending}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

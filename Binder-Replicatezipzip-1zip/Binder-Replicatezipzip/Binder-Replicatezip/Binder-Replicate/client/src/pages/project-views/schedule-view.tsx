import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useCrew, useCrewAssignments } from "@/hooks/use-crew";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScheduleDetailDialog } from "@/components/schedule-detail-dialog";
import { CrewAvailabilityCalendar } from "@/components/crew-availability-calendar";
import { CallSheetGenerator } from "@/components/call-sheet-generator";
import { Loader2, Calendar, Clock, MapPin, Users, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Event } from "@shared/schema";

const createEventSchema = z.object({
  title: z.string().min(1, "Event title required"),
  type: z.enum(["Shoot", "Meeting", "Scout"]),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  description: z.string().optional(),
});

export default function ScheduleView({ projectId }: { projectId: number }) {
  const { data: events, isLoading } = useEvents(projectId);
  const { data: crew } = useCrew(projectId);
  const { data: assignments = [] } = useCrewAssignments(projectId);
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  const form = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      type: "Shoot" as const,
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  const onCreateEvent = (data: z.infer<typeof createEventSchema>) => {
    createEvent(
      {
        projectId,
        title: data.title,
        type: data.type,
        startTime: new Date(data.startTime).toISOString() as any,
        endTime: new Date(data.endTime).toISOString() as any,
        description: data.description,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          form.reset();
        },
      }
    );
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Production Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your shoots, scouts, and meetings</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1c2128] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateEvent)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-black/20 border-white/10" placeholder="e.g., Day 1 - Interior Scenes" />
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
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1c2128] border-white/10">
                          <SelectItem value="Shoot">Shoot</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Scout">Scout</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" className="bg-black/20 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" className="bg-black/20 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location/Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-black/20 border-white/10" placeholder="Studio, beach, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isCreating} className="w-full bg-primary hover:bg-primary/90">
                  Create Event
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Event List</TabsTrigger>
          <TabsTrigger value="calendar">Crew Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {events?.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-lg border border-dashed border-white/10">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-1">No events scheduled</h3>
                <p className="text-muted-foreground">Plan your shoots, scouts, and meetings.</p>
              </div>
            ) : (
              events?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((event) => {
                const eventCrewCount = assignments.filter(a => a.eventId === event.id).length;
                return (
                  <Card 
                    key={event.id} 
                    className="bg-gradient-to-r from-card to-card/50 border border-white/10 hover:border-primary/50 overflow-hidden"
                  >
                    {/* Date Badge & Title Header */}
                    <div className="flex gap-4 p-6 pb-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex flex-col items-center justify-center border border-primary/30 relative">
                          <span className="text-xs text-primary uppercase font-bold">{format(new Date(event.startTime), "MMM")}</span>
                          <span className="text-3xl font-bold text-primary">{format(new Date(event.startTime), "d")}</span>
                          {eventCrewCount > 0 && (
                            <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                              {eventCrewCount}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${
                            event.type === 'Shoot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            event.type === 'Meeting' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {event.type}
                          </span>
                          <h3 className="text-xl font-bold text-white flex-1">{event.title}</h3>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-cyan-400">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="px-6 py-3 border-t border-white/5 bg-black/20">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          {event.description && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="w-4 h-4 text-amber-400" />
                              <span className="text-sm">{event.description}</span>
                            </div>
                          )}
                          {eventCrewCount > 0 && (
                            <div className="flex items-center gap-1.5 text-primary">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">{eventCrewCount} {eventCrewCount === 1 ? 'person' : 'people'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-3 border-t border-white/5 bg-black/30 flex gap-2 justify-end">
                      <CallSheetGenerator projectId={projectId} event={event} crew={crew} />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/10 hover:border-primary/50 text-white hover:bg-primary/10"
                        onClick={() => {
                          setSelectedEvent(event);
                          setDetailDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => {
                          if (event.id && confirm("Delete this event?")) {
                            deleteEvent(event.id);
                          }
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CrewAvailabilityCalendar projectId={projectId} />
        </TabsContent>
      </Tabs>

      <ScheduleDetailDialog 
        event={selectedEvent}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}

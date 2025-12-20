import { useEvents } from "@/hooks/use-events";
import { useCrew, useCrewAssignments } from "@/hooks/use-crew";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleDetailDialog } from "@/components/schedule-detail-dialog";
import { CallSheetGenerator } from "@/components/call-sheet-generator";
import { Loader2, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

export default function ScheduleView({ projectId }: { projectId: number }) {
  const { data: events, isLoading } = useEvents(projectId);
  const { data: crew } = useCrew(projectId);
  const { data: assignments = [] } = useCrewAssignments(projectId);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Production Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">Click any event to view or edit details and crew assignments</p>
        </div>
      </div>

      <div className="grid gap-6">
        {events?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed border-white/10">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No events scheduled</h3>
            <p className="text-muted-foreground">Plan your shoots, scouts, and meetings.</p>
          </div>
        ) : (
          events?.map((event) => {
            const eventCrewCount = assignments.filter(a => a.eventId === event.id).length;
            return (
            <Card 
              key={event.id} 
              className="bg-card border-white/5 p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer"
              onClick={() => {
                setSelectedEvent(event);
                setDetailDialogOpen(true);
              }}
            >
              <div className="flex-shrink-0 w-16 h-16 bg-black/30 rounded-lg flex flex-col items-center justify-center border border-white/5 relative">
                <span className="text-xs text-muted-foreground uppercase font-bold">{format(new Date(event.startTime), "MMM")}</span>
                <span className="text-2xl font-bold text-white">{format(new Date(event.startTime), "d")}</span>
                {eventCrewCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {eventCrewCount}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    event.type === 'Shoot' ? 'bg-red-500/20 text-red-400' :
                    event.type === 'Meeting' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {event.type}
                  </span>
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  {crew && crew.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                      {crew.length} crew
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                  </div>
                  {event.description && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.description}
                    </div>
                  )}
                  {eventCrewCount > 0 && (
                    <div className="flex items-center gap-1.5 text-primary">
                      <Users className="w-3.5 h-3.5" />
                      {eventCrewCount} {eventCrewCount === 1 ? 'person' : 'people'} assigned
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-white/10 hover:border-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  View Details
                </Button>
                <CallSheetGenerator projectId={projectId} event={event} crew={crew} />
              </div>
            </Card>
          );
          })
        )}
      </div>

      <ScheduleDetailDialog 
        event={selectedEvent}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}


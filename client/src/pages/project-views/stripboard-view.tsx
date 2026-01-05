import { useStripboardEvents, useReorderStripboard, useUpdateEventOrder } from "@/hooks/use-stripboard";
import { useShotList } from "@/hooks/use-shot-list";
import { useCrewAssignments } from "@/hooks/use-crew";
import { useDeleteEvent } from "@/hooks/use-events";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GripVertical, Trash2, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

const STRIP_COLORS = [
  "bg-blue-900/30 border-blue-500/50",
  "bg-purple-900/30 border-purple-500/50",
  "bg-pink-900/30 border-pink-500/50",
  "bg-green-900/30 border-green-500/50",
  "bg-orange-900/30 border-orange-500/50",
  "bg-red-900/30 border-red-500/50",
];

export default function StripboardView({ projectId }: { projectId: number }) {
  const { data: events = [], isLoading } = useStripboardEvents(projectId);
  const { data: shots = [] } = useShotList(projectId);
  const { data: assignments = [] } = useCrewAssignments(projectId);
  const { mutate: deleteEvent } = useDeleteEvent();
  const reorderStripboard = useReorderStripboard();
  const updateOrder = useUpdateEventOrder();

  const [draggedItem, setDraggedItem] = useState<Event | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [events]);

  const getEventColor = (index: number) => STRIP_COLORS[index % STRIP_COLORS.length];

  const getEventShots = (eventId: number) => {
    return shots.filter(shot => {
      const eventDate = new Date(eventId);
      return shot.description?.includes(format(new Date(eventId), "d")) || 
             shot.location === eventId.toString();
    });
  };

  const getEventCrew = (eventId: number) => {
    return assignments.filter(a => a.eventId === eventId).length;
  };

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    setDraggedItem(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const sourceIndex = sortedEvents.findIndex(evt => evt.id === draggedItem.id);
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...sortedEvents];
    const [movedEvent] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, movedEvent);

    const orderedIds = newOrder.map(evt => evt.id);
    reorderStripboard.mutate({ projectId, orderedEventIds: orderedIds });

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-background">
        <div className="max-w-md space-y-4">
          <GripVertical className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Scheduled Events</h3>
          <p className="text-muted-foreground">Create events in the Schedule view to see them here. Drag and drop to reorder your production day.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Stripboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Drag to reorder scenes, assign crew, and manage your production day</p>
        </div>
      </div>

      <div className="space-y-3 pb-4">
        {sortedEvents.map((event, index) => (
          <div
            key={event.id}
            draggable
            onDragStart={(e) => handleDragStart(e, event)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              transform transition-all duration-200
              ${dragOverIndex === index ? "scale-105 ring-2 ring-primary" : ""}
              ${draggedItem?.id === event.id ? "opacity-50" : ""}
            `}
          >
            <Card className={`p-4 border-l-4 cursor-grab active:cursor-grabbing ${getEventColor(index)} hover:border-opacity-100 transition-all hover:shadow-lg`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1 text-muted-foreground hover:text-white cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-white text-lg truncate">{event.title}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                        {event.type}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {/* Show event details */}}
                        className="text-muted-foreground hover:text-white hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEvent({ projectId, eventId: event.id })}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Time:</span>
                      <p className="text-white font-medium">
                        {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                      </p>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Crew:</span>
                      <p className="text-white font-medium">{getEventCrew(event.id)} assigned</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Date:</span>
                      <p className="text-white font-medium">{format(new Date(event.startTime), "MMM d")}</p>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">{event.description}</p>
                  )}

                  {event.latitude && event.longitude && (
                    <div className="text-xs text-muted-foreground mt-2">
                      📍 Location: {event.latitude}, {event.longitude}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="bg-card border border-white/5 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-white mb-2">💡 Stripboard Tips:</p>
        <ul className="space-y-1 text-xs">
          <li>• Drag cards to reorder your production schedule</li>
          <li>• Each card shows time, crew count, and location</li>
          <li>• Right-click to edit or delete events</li>
          <li>• Create events in Schedule view to add them here</li>
        </ul>
      </div>
    </div>
  );
}
